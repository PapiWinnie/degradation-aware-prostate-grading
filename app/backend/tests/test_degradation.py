# Unit tests for degradation.py.
#
# The degradation step simulates a low-bandwidth link: downscale, JPEG encode,
# then restore the original size. These tests check that the simulation is
# correct and that the model always receives an image of the expected shape.
import pytest
from PIL import Image

from degradation import CONDITIONS, apply_degradation


@pytest.mark.parametrize("condition_id", list(CONDITIONS))
def test_output_keeps_original_size_and_rgb(condition_id):
    # The classifier expects a fixed input shape, so every condition must hand
    # back an RGB image at the original dimensions, however harsh the loss.
    image = Image.new("RGB", (128, 96), (10, 200, 30))
    degraded, size_kb = apply_degradation(image, condition_id)

    assert degraded.size == image.size
    assert degraded.mode == "RGB"
    assert size_kb > 0


def test_harsher_compression_gives_smaller_payload():
    # The reported size is what the UI shows as bandwidth saved, so it must
    # shrink as conditions get harsher. Noise is used because flat colours
    # compress to almost nothing and would hide the differences.
    image = Image.effect_noise((256, 256), 50).convert("RGB")

    _, original_kb = apply_degradation(image, "original")
    _, mild_kb = apply_degradation(image, "jpeg75")
    _, harsh_kb = apply_degradation(image, "res025_jpeg10")

    assert original_kb > mild_kb > harsh_kb


def test_original_condition_is_lossless():
    # "original" is the baseline for every comparison, so it must not alter
    # a single pixel. Comparing raw bytes avoids per-pixel Python loops.
    image = Image.effect_noise((32, 32), 50).convert("RGB")
    degraded, _ = apply_degradation(image, "original")

    assert degraded.tobytes() == image.tobytes()


def test_tiny_image_does_not_collapse_to_zero_pixels():
    # 2 * 0.25 truncates to 0, and resizing to a zero dimension would crash.
    # The code clamps to 1 pixel; this guards that edge case.
    image = Image.new("RGB", (2, 2), (255, 0, 0))
    degraded, _ = apply_degradation(image, "res025")

    assert degraded.size == (2, 2)


def test_grayscale_input_is_converted_to_rgb():
    # JPEG and the model both need three channels; a grayscale upload must be
    # converted instead of failing.
    degraded, _ = apply_degradation(Image.new("L", (16, 16), 128), "jpeg25")

    assert degraded.mode == "RGB"


def test_unknown_condition_raises_key_error():
    # The function itself does not validate ids; the API layer does that
    # before calling it. This pins down the behaviour if validation is skipped.
    with pytest.raises(KeyError):
        apply_degradation(Image.new("RGB", (8, 8)), "does_not_exist")
