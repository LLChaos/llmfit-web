"""Pytest fixtures."""

from pathlib import Path

import pytest


@pytest.fixture
def data_dir() -> Path:
    """Path to mock data directory."""
    return Path(__file__).parent.parent / "src" / "data"
