# Unit tests for model_utils.py: model loading, custom checkpoints, inference.
#
# Tests marked slow run the real bundled checkpoints, so they exercise the same
# weights the deployed app uses.
import base64
import io

import pytest
import torch
from PIL import Image

from model_utils import (
    CLASSES, MODEL_REGISTRY, image_to_b64,
    load_custom_checkpoint, load_model, run_inference,
)


@pytest.mark.slow
@pytest.mark.parametrize("model_name", list(MODEL_REGISTRY))
def test_run_inference_returns_probabilities_for_every_class(model_name):
    # Every registered model must load and emit one score per Gleason class,
    # in the fixed order the frontend relies on. Softmax output is a
    # distribution, so the percentages should total about 100 (rounding to one
    # decimal per class allows a small tolerance).
    model = load_model(model_name)
    probs = run_inference(model, Image.new("RGB", (100, 100), (150, 90, 140)))

    assert [p["label"] for p in probs] == CLASSES
    assert sum(p["confidence"] for p in probs) == pytest.approx(100, abs=0.5)


def test_load_model_is_cached():
    # lru_cache means a checkpoint is read from disk once. If this breaks,
    # every request would reload the weights and latency would spike.
    assert load_model("SN-Deg") is load_model("SN-Deg")


def test_load_model_is_in_eval_mode():
    # Train mode would leave dropout active and make predictions random.
    assert not load_model("MN-Deg").training


def test_custom_checkpoint_round_trip():
    # Saving a model's weights and loading them back through the upload path
    # must reproduce them exactly.
    reference = load_model("SN-Clean")
    buf = io.BytesIO()
    torch.save(reference.state_dict(), buf)

    loaded = load_custom_checkpoint("SN-Clean", buf.getvalue())

    for key, value in reference.state_dict().items():
        assert torch.equal(value, loaded.state_dict()[key])


def test_custom_checkpoint_rejects_garbage_bytes():
    # A user can upload anything as a "checkpoint". Loading must raise so the
    # API can turn it into a clean 400 instead of crashing.
    with pytest.raises(Exception):
        load_custom_checkpoint("SN-Deg", b"this is not a checkpoint")


def test_custom_checkpoint_rejects_wrong_architecture():
    # MobileNet weights cannot fit a ShuffleNet. This is the size-mismatch
    # case that happens when someone picks the wrong model in the dropdown.
    buf = io.BytesIO()
    torch.save(load_model("MN-Deg").state_dict(), buf)

    with pytest.raises(Exception):
        load_custom_checkpoint("SN-Deg", buf.getvalue())


def test_image_to_b64_decodes_back_to_same_image():
    # The degraded image travels to the browser as base64 inside JSON. PNG is
    # lossless, so decoding must give back the exact pixels.
    image = Image.new("RGB", (16, 16), (1, 2, 3))
    decoded = Image.open(io.BytesIO(base64.b64decode(image_to_b64(image))))

    assert decoded.size == image.size
    assert decoded.getpixel((0, 0)) == (1, 2, 3)
