import io
import base64
import logging
from pathlib import Path
from functools import lru_cache

import timm                           # MobileNetV3, same library the notebook uses
import torch
import torch.nn as nn
import torchvision.models as tvm      # ShuffleNetV2
import torchvision.transforms as T
from PIL import Image


logger = logging.getLogger(__name__)

CLASSES     = ["NC", "G3", "G4", "G5"]
NUM_CLASSES = 4
IMG_SIZE    = 224

# The checkpoints folder sits next to this file.
CHECKPOINT_DIR = Path(__file__).parent / "checkpoints"

# Maps the model name the frontend sends to (architecture, checkpoint file).
MODEL_REGISTRY = {
  "MN-Clean": ("mobilenet", "mobilenet_ExpE_clean.pth"),
  "MN-Deg":   ("mobilenet", "mobilenet_degradation_degradation.pth"),
  "SN-Clean": ("shufflenet", "shufflenet_ExpB_clean.pth"),
  "SN-Deg":   ("shufflenet", "shufflenet_degradation_degradation.pth"),
}

# The config each model was trained with. The head shape has to match the
# saved weights, otherwise load_state_dict fails with a size mismatch.
#   MN-Clean and MN-Deg use the ExpE config (dropout 0.3).
#   SN-Clean and SN-Deg use the ExpB config (no dropout, plain linear head).
MODEL_CONFIGS = {
  "MN-Clean": {"drop_rate": 0.3, "dense_head": False, "flat_head": True},
  "MN-Deg":   {"drop_rate": 0.3, "dense_head": False},
  "SN-Clean": {"drop_rate": 0.0, "dense_head": False},
  "SN-Deg":   {"drop_rate": 0.0, "dense_head": False},
}

# Same preprocessing as the notebook: resize slightly larger, center crop to
# the model's input size, then normalize with the ImageNet statistics.
TRANSFORM = T.Compose([
  T.Resize(IMG_SIZE + 16),
  T.CenterCrop(IMG_SIZE),
  T.ToTensor(),
  T.Normalize(mean=[0.485, 0.456, 0.406],
              std=[0.229, 0.224, 0.225]),
])


# Architecture builders. These mirror build_model_empirical() in the notebook.

def _build_mobilenet(config: dict) -> nn.Module:
  # num_classes=0 removes timm's own head so we can attach ours below.
  model = timm.create_model("mobilenetv3_small_100", pretrained=False, num_classes=0)

  # Run a dummy image through to read the feature size instead of hardcoding it.
  with torch.no_grad():
    in_feat = model(torch.zeros(1, 3, IMG_SIZE, IMG_SIZE)).shape[1]

  drop = config["drop_rate"]

  if config.get("dense_head"):
    # Linear -> ReLU -> Dropout -> Linear (a hidden layer of 256 units).
    model.classifier = nn.Sequential(
      nn.Linear(in_feat, 256), nn.ReLU(),
      nn.Dropout(drop), nn.Linear(256, NUM_CLASSES),
    )
  elif config.get("flat_head"):
    # The MN-Clean checkpoint was saved with a bare linear layer and no dropout.
    model.classifier = nn.Linear(in_feat, NUM_CLASSES)
  else:
    # Dropout followed by one linear layer.
    model.classifier = nn.Sequential(
      nn.Dropout(drop), nn.Linear(in_feat, NUM_CLASSES),
    )
  return model


def _build_shufflenet(config: dict) -> nn.Module:
  model   = tvm.shufflenet_v2_x1_0(weights=None)
  in_feat = model.fc.in_features
  drop    = config["drop_rate"]

  if config.get("dense_head"):
    model.fc = nn.Sequential(
      nn.Linear(in_feat, 256), nn.ReLU(),
      nn.Dropout(drop), nn.Linear(256, NUM_CLASSES),
    )
  elif drop > 0:
    model.fc = nn.Sequential(nn.Dropout(drop), nn.Linear(in_feat, NUM_CLASSES))
  else:
    # The best configuration is also the simplest: one linear layer.
    model.fc = nn.Linear(in_feat, NUM_CLASSES)
  return model


def _build(arch: str, config: dict) -> nn.Module:
  return _build_mobilenet(config) if arch == "mobilenet" else _build_shufflenet(config)


# Loading

# lru_cache keeps each loaded model in memory, so only the first request for a
# model reads its checkpoint from disk.
@lru_cache(maxsize=4)
def load_model(model_name: str) -> nn.Module:
  arch, filename = MODEL_REGISTRY[model_name]
  ckpt_path      = CHECKPOINT_DIR / filename
  model          = _build(arch, MODEL_CONFIGS[model_name])

  if ckpt_path.exists():
    # weights_only=True limits what pickle may load, which blocks code
    # execution from a tampered file.
    state = torch.load(ckpt_path, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
  else:
    # Random weights: inference still runs, but the results are meaningless.
    logger.warning("Checkpoint %s not found; %s is using random weights", ckpt_path, model_name)

  # eval() turns dropout off, so predictions are deterministic.
  return model.eval()


# Used when the user uploads their own .pth. Any failure here (corrupt file,
# wrong architecture) propagates to the API layer, which reports it as a 400.
def load_custom_checkpoint(model_name: str, ckpt_bytes: bytes) -> nn.Module:
  arch, _ = MODEL_REGISTRY[model_name]
  model   = _build(arch, MODEL_CONFIGS[model_name])
  state   = torch.load(io.BytesIO(ckpt_bytes), map_location="cpu", weights_only=True)
  model.load_state_dict(state)
  return model.eval()


# Inference

# Gradients are only needed for training, so turning them off saves memory
# and time here.
@torch.no_grad()
def run_inference(model: nn.Module, image: Image.Image) -> list[dict]:
  # Steps: preprocess, add a batch dimension, run the model, softmax into
  # probabilities, then convert each one to a percentage.
  tensor = TRANSFORM(image.convert("RGB")).unsqueeze(0)
  probs  = torch.softmax(model(tensor), dim=1).squeeze()

  return [
    {"label": CLASSES[i], "confidence": round(probs[i].item() * 100, 1)}
    for i in range(NUM_CLASSES)
  ]


# PNG is lossless, so the browser shows exactly what the model saw. Base64
# lets the image travel inside the JSON response.
def image_to_b64(image: Image.Image) -> str:
  buf = io.BytesIO()
  image.save(buf, format="PNG")
  return base64.b64encode(buf.getvalue()).decode()
