import io
from PIL import Image

# (resive_factor, jpeg_quality)

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

def apply_degradation(image, condition_id):
    resize_factor, jpeg_quality = CONDITIONS[condition_id]

    img = image.convert("RGB")
    original_size = img.size

    # First we downscale

    if resize_factor is not None:
        w = max(1, int(original_size[0] * resize_factor))
        h = max(1, int(original_size[1] * resize_factor))
        img = img.resize((w,h), Image.LANCZOS)

    # Step 2: JPEG encode then decode
    buf = io.BytesIO()
    if jpeg_quality is not None:
        img.save(buf, format='JPEG', quality=jpeg_quality)
        size_kb = buf.tell() / 1024
        buf.seek(0)
        img = Image.open(buf).copy()
    else:
        img.save(buf, format='PNG')
        size_kb = buf.tell() / 1024

    # Step 3: restore original size so the model always gets the same dims

    if resize_factor is not None:
        img = img.resize(original_size, Image.LANCZOS)


    return img, round(size_kb, 1)