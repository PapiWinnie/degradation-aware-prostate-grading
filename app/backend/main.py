import io
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from degradation import CONDITIONS, apply_degradation
from model_utils import (
    MODEL_REGISTRY, ModelUnavailableError, image_to_b64,
    load_custom_checkpoint, load_model, run_inference,
)
from schemas import GleasonProb, InferenceResult

logger = logging.getLogger(__name__)

# Uploads above this size are refused before decoding.
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


# Runs once when the server boots. Loading all four models here means the
# first request does not pay the cost of reading the checkpoints from disk.
# A missing checkpoint stops the start-up, so a server without its trained
# weights is never put into service.
@asynccontextmanager
async def lifespan(app: FastAPI):
    for name in MODEL_REGISTRY:
        load_model(name)
    yield


app = FastAPI(title="CompressPath API", version="0.1.0", lifespan=lifespan)

# The frontend and the API run on different origins, so the browser blocks the
# calls unless the API sends CORS headers. Only the deployed frontend is allowed,
# which backs the privacy policy's Security statement that the service only
# accepts browser requests that come from this website.
# To develop locally, set ALLOWED_ORIGINS to a comma-separated list, for example
# ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_ORIGIN = "https://degradation-aware-prostate-grading.vercel.app"
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", FRONTEND_ORIGIN).split(",")]
app.add_middleware(CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"])


# BytesIO lets Pillow decode the upload straight from memory, so no temporary
# file is ever written. This is what the privacy policy means by "does not write
# your image to disk" (What the site does not do, How long data is kept).
# Decoding can fail for any non-image file, so the failure is turned into a
# 400 with a message instead of an unhandled server error.
def open_image(data: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        # The library's own message names internal objects, so it is only logged.
        logger.warning("Upload could not be decoded as an image", exc_info=True)
        raise HTTPException(400, "That file could not be read as an image. Upload a PNG or JPEG.")


# Routes

# Health check. The deployment platform calls this to know the app is up.
@app.get("/")
def root():
    return {"status": "ok"}

# Lets the frontend build its model selector from the backend registry.
@app.get("/models")
def list_models():
    return {"models": list(MODEL_REGISTRY.keys())}

@app.get("/conditions")
def list_conditions():
    return {"conditions": list(CONDITIONS.keys())}


@app.post("/infer", response_model=InferenceResult)
async def infer(
    image:        UploadFile        = File(...),                # tissue patch, PNG or JPG
    model_name:   str               = Form(...),                # for example "SN-Deg"
    condition_id: str               = Form(...),                # for example "res025_jpeg25"
    checkpoint:   UploadFile | None = File(default=None),       # optional custom .pth
):
    # Check the cheap things first so bad requests fail before any heavy work.
    if model_name not in MODEL_REGISTRY:
        raise HTTPException(422, f"Unknown model '{model_name}'")
    if condition_id not in CONDITIONS:
        raise HTTPException(422, f"Unknown condition '{condition_id}'")

    # Read the upload and refuse oversized files before decoding them.
    raw = await image.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, f"That image is larger than {MAX_UPLOAD_BYTES // (1024 * 1024)} MB. Choose a smaller one.")
    original_size_kb = round(len(raw) / 1024, 1)
    pil_image = open_image(raw)

    # Simulate the transmission. Returns the degraded image and its payload size.
    degraded, degraded_size_kb = apply_degradation(pil_image, condition_id)

    # Use the uploaded checkpoint if there is one, otherwise the bundled one.
    # A bad upload is the user's mistake, so it is a 400 and not a 500.
    if checkpoint:
        try:
            model = load_custom_checkpoint(model_name, await checkpoint.read())
        except Exception:
            # PyTorch's message can run to many lines, so it is only logged.
            logger.warning("Custom checkpoint could not be loaded", exc_info=True)
            raise HTTPException(400, "Bad checkpoint: these weights could not be loaded for this model.")
    else:
        # A missing bundled checkpoint is a server fault, not a bad request. It is
        # refused with a 503 so that random weights never produce a prediction.
        try:
            model = load_model(model_name)
        except ModelUnavailableError:
            raise HTTPException(503, "This model is not available right now. Please try another model later.")

    # The model sees the degraded image, never the original. That is the
    # whole point of the experiment.
    try:
        probs = run_inference(model, degraded)
    except Exception:
        # The exception text is for the log, not for the user.
        logger.exception("Inference failed")
        raise HTTPException(500, "Inference failed. Please try again.")
    top = max(probs, key=lambda p: p["confidence"])

    return InferenceResult(
        predicted_grade    = top["label"],
        top_confidence     = top["confidence"],
        probabilities      = [GleasonProb(**p) for p in probs],
        model_used         = model_name,
        condition_used     = condition_id,
        original_size_kb   = original_size_kb,
        degraded_size_kb   = degraded_size_kb,
        degraded_image_b64 = image_to_b64(degraded),
        custom_checkpoint  = checkpoint is not None,
    )
