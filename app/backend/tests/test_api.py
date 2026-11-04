"""Integration and error-handling tests for the FastAPI routes in main.py.

These go through the real HTTP layer (validation, upload parsing, degradation,
model, response schema), so they catch problems the unit tests cannot. The
error tests check that bad input produces a clear status code and message
instead of an unhandled server error.
"""
import io
import time

import pytest
import torch

import main
from degradation import CONDITIONS
from model_utils import CLASSES, MODEL_REGISTRY, load_model


def post_infer(client, image_bytes, model_name="SN-Deg", condition_id="original", **files):
    """Send a multipart /infer request; extra files (e.g. checkpoint) are merged in."""
    return client.post(
        "/infer",
        data={"model_name": model_name, "condition_id": condition_id},
        files={"image": ("patch.png", image_bytes, "image/png"), **files},
    )


def test_root_reports_ok(client):
    # Health check used by the deployment platform to know the app is up.
    assert client.get("/").json() == {"status": "ok"}


def test_models_lists_registry(client):
    # The frontend builds its model selector from this, so it must match the
    # backend registry exactly.
    assert client.get("/models").json() == {"models": list(MODEL_REGISTRY)}


def test_conditions_lists_all_conditions(client):
    # Same contract for the transmission-condition selector.
    assert client.get("/conditions").json() == {"conditions": list(CONDITIONS)}


def test_infer_returns_full_result(client, png_bytes):
    # Happy path: every field the UI displays must be present and consistent
    # with what was requested.
    response = post_infer(client, png_bytes, "SN-Deg", "res025_jpeg25")

    assert response.status_code == 200
    body = response.json()
    assert body["predicted_grade"] in CLASSES
    assert body["model_used"] == "SN-Deg"
    assert body["condition_used"] == "res025_jpeg25"
    assert len(body["probabilities"]) == len(CLASSES)
    assert body["degraded_size_kb"] > 0
    assert body["degraded_image_b64"]


@pytest.mark.parametrize("model_name", list(MODEL_REGISTRY))
@pytest.mark.parametrize("condition_id", ["original", "res025_jpeg10"])
def test_every_model_runs_under_clean_and_worst_condition(client, png_bytes, model_name, condition_id):
    # Compatibility matrix: all four models against the best and worst
    # conditions, to catch a model that only works for some inputs.
    assert post_infer(client, png_bytes, model_name, condition_id).status_code == 200


def test_predicted_grade_has_highest_confidence(client, png_bytes):
    # The headline grade must always be the class with the top probability.
    body = post_infer(client, png_bytes).json()
    top = max(body["probabilities"], key=lambda p: p["confidence"])

    assert body["predicted_grade"] == top["label"]
    assert body["top_confidence"] == top["confidence"]


def test_infer_with_valid_custom_checkpoint(client, png_bytes):
    # The optional upload path: a correct checkpoint for the chosen model
    # should be accepted and used.
    buf = io.BytesIO()
    torch.save(load_model("SN-Deg").state_dict(), buf)

    response = post_infer(
        client, png_bytes,
        checkpoint=("custom.pth", buf.getvalue(), "application/octet-stream"),
    )

    assert response.status_code == 200


def test_unknown_model_is_rejected(client, png_bytes):
    # Error handling: a bad model name is a client mistake (422) and the
    # message should name the offending value.
    response = post_infer(client, png_bytes, model_name="nope")

    assert response.status_code == 422
    assert "nope" in response.json()["detail"]


def test_unknown_condition_is_rejected(client, png_bytes):
    # Same as above for the condition id.
    response = post_infer(client, png_bytes, condition_id="nope")

    assert response.status_code == 422
    assert "nope" in response.json()["detail"]


def test_non_image_upload_returns_400(client):
    # Error handling: a file that is not an image must give a readable 400,
    # not a 500 from the decoder.
    response = post_infer(client, b"definitely not an image")

    assert response.status_code == 400
    assert "Cannot decode image" in response.json()["detail"]


def test_empty_upload_returns_400(client):
    # Edge case: a zero-byte file is a common result of a failed upload.
    assert post_infer(client, b"").status_code == 400


def test_oversized_upload_returns_413(client, png_bytes, monkeypatch):
    # The limit is lowered for this test so we do not have to build a 10 MB
    # file. The point is that large uploads are refused before any processing.
    monkeypatch.setattr(main, "MAX_UPLOAD_BYTES", 10)

    assert post_infer(client, png_bytes).status_code == 413


def test_bad_checkpoint_returns_400(client, png_bytes):
    # A corrupt custom checkpoint is the user's input problem, so it is a 400
    # with a message, and the server keeps running.
    response = post_infer(
        client, png_bytes,
        checkpoint=("bad.pth", b"garbage", "application/octet-stream"),
    )

    assert response.status_code == 400
    assert "Bad checkpoint" in response.json()["detail"]


def test_missing_image_returns_422(client):
    # FastAPI validates required fields before our code runs.
    response = client.post("/infer", data={"model_name": "SN-Deg", "condition_id": "original"})

    assert response.status_code == 422


def test_inference_crash_returns_500_with_message(client, png_bytes, monkeypatch):
    # Simulate an unexpected failure inside the model. The API should report
    # a controlled 500 with a message rather than dropping the connection.
    def explode(model, image):
        raise RuntimeError("boom")

    monkeypatch.setattr(main, "run_inference", explode)
    response = post_infer(client, png_bytes)

    assert response.status_code == 500
    assert "Inference failed" in response.json()["detail"]


def test_single_inference_is_fast_enough(client, png_bytes):
    # Basic performance check: a warm request should stay interactive. The
    # first call is a warm-up so one-time model loading is not measured.
    post_infer(client, png_bytes)

    start = time.perf_counter()
    post_infer(client, png_bytes)

    assert time.perf_counter() - start < 2.0
