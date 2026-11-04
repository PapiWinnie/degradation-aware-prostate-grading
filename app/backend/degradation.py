import io
from PIL import Image

# Each condition is (resize_factor, jpeg_quality). None means that step is skipped.
CONDITIONS = {
    "original":        (None,  None),
    "jpeg75":          (None,  75),
    "res05":           (0.5,   None),
    "jpeg25":          (None,  25),
    "res025":          (0.25,  None),
    "res05_jpeg50":    (0.5,   50),
    "res025_jpeg50":   (0.25,  50),
    "res025_jpeg25":   (0.25,  25),
    "res025_jpeg10":   (0.25,  10),
}


# Simulates sending a patch over a slow link. Returns the degraded image and
# the size in KB of the data that would have crossed the network.
def apply_degradation(image, condition_id):
    resize_factor, jpeg_quality = CONDITIONS[condition_id]

    img = image.convert("RGB")
    original_size = img.size

    # Step 1: shrink the image. The max(1, ...) stops tiny images from
    # resizing to zero pixels.
    if resize_factor is not None:
        w = max(1, int(original_size[0] * resize_factor))
        h = max(1, int(original_size[1] * resize_factor))
        img = img.resize((w, h), Image.LANCZOS)

    # Step 2: encode and decode. JPEG is lossy, so decoding gives back the
    # damaged image. Lossless conditions are measured as PNG instead.
    # The size is read here, on the encoded bytes, because that is the
    # payload size. Scaling back up in step 3 would not change what was sent.
    buf = io.BytesIO()
    if jpeg_quality is not None:
        img.save(buf, format='JPEG', quality=jpeg_quality)
        size_kb = buf.tell() / 1024
        buf.seek(0)
        img = Image.open(buf).copy()
    else:
        img.save(buf, format='PNG')
        size_kb = buf.tell() / 1024

    # Step 3: scale back up so the model always receives the same dimensions.
    if resize_factor is not None:
        img = img.resize(original_size, Image.LANCZOS)

    return img, round(size_kb, 1)
