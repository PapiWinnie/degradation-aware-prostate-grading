import io
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from degradation import CONDITIONS, apply_degradation
from model_utils import (
    MODEL_REGISTRY, image_to_b64,
    load_custom_checkpoint, load_model, run_inference,
)
from schemas import GleasonProb, InferenceResult


# ==== Startup event ================================================================================================================─
# lifespan runs once when the server boots.
# Pre-loading all 4 models here means the first  request isn't slow.

@asynccontextmanager
async def lifespan(app: FastAPI):
    for name in MODEL_REGISTRY:
        load_model(name)
    yield


# ==== App + CORS ========================================================================================================================

app = FastAPI(title="CompressPath API", version="0.1.0", lifespan=lifespan)

# Without this, the browser blocks the frontend from calling the API
# because they run on different ports (5173 vs 8000)
app.add_middleware(CORSMiddleware,
allow_origins=["*"],          # open for testing
allow_methods=["*"],
allow_headers=["*"])


# ==== Small helper ====================================================================================================================

def open_image(data: bytes) -> Image.Image:
    try:
        return Image.open(io.BytesIO(data)).convert("RGB")
    except Exception as e:
        raise HTTPException(400, f"Cannot decode image: {e}")


# ==== Routes ========================

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/models")
def list_models():
    # Lets the frontend dynamically populate the model selector if needed
    return {"models": list(MODEL_REGISTRY.keys())}

@app.get("/conditions")
def list_conditions():
    return {"conditions": list(CONDITIONS.keys())}


@app.post("/infer", response_model=InferenceResult)
async def infer(
    image:        UploadFile        = File(...),    # the tissue patch PNG/JPG
    model_name:   str               = Form(...),    # e.g. "SN-Deg"
    condition_id: str               = Form(...),    # e.g. "res025_jpeg25"
    checkpoint:   UploadFile | None = File(default=None),  # optional custom .pth
):
    # Validate before doing any work
    if model_name not in MODEL_REGISTRY:
        raise HTTPException(422, f"Unknown model '{model_name}'")
    if condition_id not in CONDITIONS:
        raise HTTPException(422, f"Unknown condition '{condition_id}'")

    # 1. Read the uploaded image bytes and measure raw size
    raw = await image.read()
    original_size_kb = round(len(raw) / 1024, 1)
    pil_image = open_image(raw)

    # 2. Apply degradation returns degraded PIL image + wire size in KB
    degraded, degraded_size_kb = apply_degradation(pil_image, condition_id)

    # 3. Load model custom .pth if uploaded, otherwise the bundled checkpoint
    if checkpoint:
        try:
            model = load_custom_checkpoint(model_name, await checkpoint.read())
        except Exception as e:
            raise HTTPException(400, f"Bad checkpoint: {e}")
    else:
        model = load_model(model_name)

    # 4. Run inference on the DEGRADED image (not the original)
    probs = run_inference(model, degraded)
    top   = max(probs, key=lambda p: p["confidence"])

    # 5. Pack everything into the response schema and return
    return InferenceResult(
        predicted_grade    = top["label"],
        top_confidence     = top["confidence"],
        probabilities      = [GleasonProb(**p) for p in probs],
        model_used         = model_name,
        condition_used     = condition_id,
        original_size_kb   = original_size_kb,
        degraded_size_kb   = degraded_size_kb,
        degraded_image_b64 = image_to_b64(degraded),
    )