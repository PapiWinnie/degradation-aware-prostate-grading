import io
from PIL import Image

# The nine conditions of the experiment, with the same ids as the notebook.
# Each is (resize_factor, jpeg_quality). None means that step is skipped.
# The notebook shrinks 512 by 512 patches to 256, 128 and 64 pixels, which are
# the factors 0.5, 0.25 and 0.125 here, so the result is identical for a
# 512 by 512 patch and still works for other sizes.
CONDITIONS = {
    "clean":               (None,  None),
    "jpeg75":              (None,  75),
    "jpeg50":              (None,  50),
    "jpeg25":              (None,  25),
    "res256":              (0.5,   None),
    "res128":              (0.25,  None),
    "res256_jpeg50":       (0.5,   50),
    "res128_jpeg25":       (0.25,  25),
    "stress_res64_jpeg25": (0.125, 25),
}


def _png_kb(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.tell() / 1024


# Applies one condition with the same order of operations as the notebook:
# shrink with bilinear resampling, enlarge back with bilinear resampling, then
# JPEG encode and decode the enlarged image (subsampling 4:2:0, no optimisation).
#
# Returns the degraded image and the size in KB of the encoded bytes that decode
# to the image the model receives:
#   - JPEG conditions: the JPEG bytes of that image.
#   - Resize-only conditions: the PNG of the shrunken image. PNG is lossless, so
#     a receiver that enlarges it bilinearly gets exactly the image the model sees.
#   - clean: the PNG of the patch.
# For the conditions that combine a resize and JPEG, the JPEG is applied after the
# enlargement, so the size is that of the 512 by 512 JPEG and not of a JPEG of the
# shrunken image.
def apply_degradation(image, condition_id):
    resize_factor, jpeg_quality = CONDITIONS[condition_id]

    img = image.convert("RGB")
    original_size = img.size
    lossless_kb = None

    # Step 1: shrink, then enlarge back so the model always receives the same
    # dimensions. The max(1, ...) stops tiny images from resizing to zero pixels.
    if resize_factor is not None:
        w = max(1, int(original_size[0] * resize_factor))
        h = max(1, int(original_size[1] * resize_factor))
        small = img.resize((w, h), Image.BILINEAR)
        lossless_kb = _png_kb(small)
        img = small.resize(original_size, Image.BILINEAR)

    # Step 2: JPEG is lossy, so decoding gives back the damaged image.
    if jpeg_quality is not None:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=jpeg_quality, subsampling=2, optimize=False)
        size_kb = buf.tell() / 1024
        buf.seek(0)
        img = Image.open(buf).copy()   # .copy() closes the buffer
    elif lossless_kb is not None:
        size_kb = lossless_kb
    else:
        size_kb = _png_kb(img)

    return img, round(size_kb, 1)
