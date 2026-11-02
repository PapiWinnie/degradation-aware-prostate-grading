import io
import base64
from pathlib import Path
from functools import lru_cache

import timm            # for MobileNetV3 same lib notebook uses
import torch
import torch.nn as nn
import torchvision.models as tvm  # for ShuffleNetV2
import torchvision.transforms as T
from PIL import Image


# === Constants ======================

CLASSES   = ["NC", "G3", "G4", "G5"]
NUM_CLASSES = 4
IMG_SIZE  = 224

# checkpoints/ folder sits next to this file
CHECKPOINT_DIR = Path(__file__).parent / "checkpoints"

# Frontend name 
MODEL_REGISTRY = {
  "MN-Clean": ("mobilenet", "mobilenet_ExpE_clean.pth"),
  "MN-Deg":  ("mobilenet", "mobilenet_degradation_degradation.pth"),
  "SN-Clean": ("shufflenet", "shufflenet_ExpB_clean.pth"),
  "SN-Deg":  ("shufflenet", "shufflenet_degradation_degradation.pth"),
}

# The config that was active when each model was trained.
# This determines the head shape must match the .pth or you get a size mismatch.
#  MN-Clean / MN-Deg -> trained with ExpE config (dropout=0.3, flat head)
#  SN-Clean / SN-Deg -> trained with ExpB config (no dropout, plain linear head)
MODEL_CONFIGS = {
  "MN-Clean": {"drop_rate": 0.3, "dense_head": False, "flat_head": True},
  "MN-Deg":  {"drop_rate": 0.3, "dense_head": False},
  "SN-Clean": {"drop_rate": 0.0, "dense_head": False},
  "SN-Deg":  {"drop_rate": 0.0, "dense_head": False},
}

# Standard ImageNet normalisation used during training in our notebook
TRANSFORM = T.Compose([
  T.Resize((IMG_SIZE, IMG_SIZE)),
  T.ToTensor(),
  T.Normalize(mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]),
])


# ===== Architecture builders ==========================================
# These mirror build_model_empirical() from  notebook exactly.

def _build_mobilenet(config: dict) -> nn.Module:
  # num_classes=0 tells timm to remove its own head we attach ours below
  model = timm.create_model("mobilenetv3_small_100", pretrained=False, num_classes=0)

  # Dummy forward pass to find the actual feature dimension (usually 1024)
  with torch.no_grad():
    in_feat = model(torch.zeros(1, 3, IMG_SIZE, IMG_SIZE)).shape[1]

  drop = config["drop_rate"]

  if config.get("dense_head"):
    # ExpF config: Linear(1024->256) -> ReLU -> Dropout -> Linear(256->4)
    model.classifier = nn.Sequential(
      nn.Linear(in_feat, 256), nn.ReLU(),
      nn.Dropout(drop), nn.Linear(256, NUM_CLASSES),
    )
  elif config.get("flat_head"):
    # MN-Clean checkpoint was saved with a bare Linear(1024->4) head
    model.classifier = nn.Linear(in_feat, NUM_CLASSES)
  else:
    # ExpE config: Dropout -> Linear(1024->4)
    model.classifier = nn.Sequential(
      nn.Dropout(drop), nn.Linear(in_feat, NUM_CLASSES),
    )
  return model


def _build_shufflenet(config: dict) -> nn.Module:
  model  = tvm.shufflenet_v2_x1_0(weights=None)
  in_feat = model.fc.in_features  # 1024 for x1.0 variant
  drop  = config["drop_rate"]

  if config.get("dense_head"):
    model.fc = nn.Sequential(
      nn.Linear(in_feat, 256), nn.ReLU(),
      nn.Dropout(drop), nn.Linear(256, NUM_CLASSES),
    )
  elif drop > 0:
    # ExpC/D/E config
    model.fc = nn.Sequential(nn.Dropout(drop), nn.Linear(in_feat, NUM_CLASSES))
  else:
    # ExpB config (the winner) just a single linear layer, nothing else
    model.fc = nn.Linear(in_feat, NUM_CLASSES)
  return model


def _build(arch: str, config: dict) -> nn.Module:
  return _build_mobilenet(config) if arch == "mobilenet" else _build_shufflenet(config)


# === Loading =========================─

@lru_cache(maxsize=4)
def load_model(model_name: str) -> nn.Module:
  """
  Load a bundled checkpoint. @lru_cache means each .pth is read from disk
  only once subsequent calls return the already-loaded model instantly.
  """
  arch, filename = MODEL_REGISTRY[model_name]
  ckpt_path   = CHECKPOINT_DIR / filename
  model     = _build(arch, MODEL_CONFIGS[model_name])

  if ckpt_path.exists():
    state = torch.load(ckpt_path, map_location="cpu", weights_only=True)
    model.load_state_dict(state)
  # No .pth -> random weights. Inference still runs, results are meaningless.

  return model.eval()  # .eval() disables dropout at inference time


def load_custom_checkpoint(model_name: str, ckpt_bytes: bytes) -> nn.Module:
  """Used when the user uploads their own .pth via the frontend."""
  arch, _ = MODEL_REGISTRY[model_name]
  model  = _build(arch, MODEL_CONFIGS[model_name])
  state  = torch.load(io.BytesIO(ckpt_bytes), map_location="cpu", weights_only=True)
  model.load_state_dict(state)
  return model.eval()


# === Inference ======================─

@torch.no_grad()  # disables gradient tracking faster, uses less memory
def run_inference(model: nn.Module, image: Image.Image) -> list[dict]:
  """
  Single image -> list of 4 class probabilities.

  Flow: PIL image -> normalize -> (1,3,224,224) tensor -> model -> softmax -> %
  """
  tensor = TRANSFORM(image.convert("RGB")).unsqueeze(0) # add batch dim
  probs = torch.softmax(model(tensor), dim=1).squeeze() # (4,) probabilities

  return [
    {"label": CLASSES[i], "confidence": round(probs[i].item() * 100, 1)}
    for i in range(NUM_CLASSES)
  ]


def image_to_b64(image: Image.Image) -> str:
  """Encode PIL image as base64 string so it can travel in JSON."""
  buf = io.BytesIO()
  image.save(buf, format="PNG")
  return base64.b64encode(buf.getvalue()).decode()