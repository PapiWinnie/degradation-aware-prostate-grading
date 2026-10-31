from pydantic import BaseModel

class GleasonProb(BaseModel):
    label: str
    confidence: float

class InferenceResult(BaseModel):
    predicted_grade:str
    top_confidence:float
    probabilities: list[GleasonProb]
    model_used:str
    condition_used:str
    original_size_kb:float
    degraded_size_kb: float
    degraded_image_b64:str