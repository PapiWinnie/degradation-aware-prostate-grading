"""Shared fixtures for the backend test suite.

Run from app/backend with:  pytest -v
Skip the tests that run the real model checkpoints with:  pytest -m "not slow"
"""
import io

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from main import app


def make_png_bytes(size=(64, 64), color=(180, 80, 120)):
    """Build a small in-memory PNG so tests never depend on files on disk."""
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


@pytest.fixture(scope="session")
def client():
    """HTTP client that talks to the FastAPI app without starting a server.

    It is deliberately not used as a context manager, so the startup hook that
    preloads all four models is skipped. Models load lazily on first request,
    which keeps the suite fast and lets each test pay only for what it uses.
    """
    return TestClient(app)


@pytest.fixture
def png_bytes():
    """A valid tissue-patch stand-in that every endpoint test can upload."""
    return make_png_bytes()
