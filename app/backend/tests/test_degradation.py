# Unit tests for degradation.py.
#
# The degradation step follows the notebook: shrink, enlarge back, then JPEG.
# These tests check that the order of operations and the sizes match the
# notebook, and that the model always receives an image of the expected shape.
import io

import pytest
from PIL import Image

from degradation import CONDITIONS, apply_degradation


# The notebook's own functions, copied here so the test can compare against them.
def notebook_apply_jpeg(img, quality):
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality, subsampling=2, optimize=False)
    buf.seek(0)
    return Image.open(buf).copy()


def notebook_apply_resize_down_up(img, target_px):
    small = img.resize((target_px, target_px), Image.BILINEAR)
    return small.resize((img.width, img.height), Image.BILINEAR)


NOTEBOOK_CONDITIONS = {
    "clean":               lambda img: img,
    "jpeg75":              lambda img: notebook_apply_jpeg(img, 75),
    "jpeg50":              lambda img: notebook_apply_jpeg(img, 50),
    "jpeg25":              lambda img: notebook_apply_jpeg(img, 25),
    "res256":              lambda img: notebook_apply_resize_down_up(img, 256),
    "res128":              lambda img: notebook_apply_resize_down_up(img, 128),
    "res256_jpeg50":       lambda img: notebook_apply_jpeg(notebook_apply_resize_down_up(img, 256), 50),
    "res128_jpeg25":       lambda img: notebook_apply_jpeg(notebook_apply_resize_down_up(img, 128), 25),
    "stress_res64_jpeg25": lambda img: notebook_apply_jpeg(notebook_apply_resize_down_up(img, 64), 25),
}


def test_conditions_are_the_nine_notebook_conditions():
    assert list(CONDITIONS) == list(NOTEBOOK_CONDITIONS)


@pytest.mark.parametrize("condition_id", list(CONDITIONS))
def test_output_matches_the_notebook_pixel_for_pixel(condition_id):
    # The test bench claims to apply the experiment's conditions, so on a
    # 512 by 512 patch the output must equal the notebook's output exactly.
    image = Image.effect_noise((512, 512), 60).convert("RGB")
    degraded, _ = apply_degradation(image, condition_id)
    expected = NOTEBOOK_CONDITIONS[condition_id](image)

    assert degraded.tobytes() == expected.tobytes()


@pytest.mark.parametrize("condition_id", list(CONDITIONS))
def test_output_keeps_original_size_and_rgb(condition_id):
    # The classifier expects a fixed input shape, so every condition must hand
    # back an RGB image at the original dimensions, however harsh the loss.
    image = Image.new("RGB", (128, 96), (10, 200, 30))
    degraded, size_kb = apply_degradation(image, condition_id)

    assert degraded.size == image.size
    assert degraded.mode == "RGB"
    assert size_kb > 0


def test_jpeg_size_is_that_of_the_jpeg_the_model_saw():
    # For a condition that combines a resize and JPEG, the JPEG is applied to the
    # enlarged image, so the reported size is that of the full-size JPEG.
    image = Image.effect_noise((512, 512), 60).convert("RGB")
    _, size_kb = apply_degradation(image, "res128_jpeg25")

    enlarged = notebook_apply_resize_down_up(image, 128)
    buf = io.BytesIO()
    enlarged.save(buf, format="JPEG", quality=25, subsampling=2, optimize=False)

    assert size_kb == round(buf.tell() / 1024, 1)


def test_resize_only_size_is_the_png_of_the_shrunken_image():
    # PNG is lossless, so the shrunken PNG decodes to the image the model sees
    # once the receiver enlarges it.
    image = Image.effect_noise((512, 512), 60).convert("RGB")
    _, size_kb = apply_degradation(image, "res128")

    buf = io.BytesIO()
    image.resize((128, 128), Image.BILINEAR).save(buf, format="PNG")

    assert size_kb == round(buf.tell() / 1024, 1)


def test_harsher_compression_gives_smaller_payload():
    # The reported size is what the UI shows as bandwidth saved, so it must
    # shrink as conditions get harsher. Noise is used because flat colours
    # compress to almost nothing and would hide the differences.
    image = Image.effect_noise((256, 256), 50).convert("RGB")

    _, clean_kb = apply_degradation(image, "clean")
    _, mild_kb = apply_degradation(image, "jpeg75")
    _, harsh_kb = apply_degradation(image, "stress_res64_jpeg25")

    assert clean_kb > mild_kb > harsh_kb


def test_clean_condition_is_lossless():
    # "clean" is the baseline for every comparison, so it must not alter
    # a single pixel. Comparing raw bytes avoids per-pixel Python loops.
    image = Image.effect_noise((32, 32), 50).convert("RGB")
    degraded, _ = apply_degradation(image, "clean")

    assert degraded.tobytes() == image.tobytes()


def test_tiny_image_does_not_collapse_to_zero_pixels():
    # 2 * 0.125 truncates to 0, and resizing to a zero dimension would crash.
    # The code clamps to 1 pixel; this guards that edge case.
    image = Image.new("RGB", (2, 2), (255, 0, 0))
    degraded, _ = apply_degradation(image, "stress_res64_jpeg25")

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
