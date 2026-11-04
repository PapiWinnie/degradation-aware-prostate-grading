from pydantic import BaseModel


# Probability for one Gleason class, as a percentage.
class GleasonProb(BaseModel):
    label: str
    confidence: float


# Response body of POST /infer. FastAPI uses it to validate and document the
# output, so a missing or mistyped field fails loudly instead of reaching the UI.
class InferenceResult(BaseModel):
    predicted_grade: str
    top_confidence: float
    probabilities: list[GleasonProb]
    model_used: str
    condition_used: str
    original_size_kb: float
    degraded_size_kb: float
    degraded_image_b64: str    # PNG of the degraded patch, base64 encoded
