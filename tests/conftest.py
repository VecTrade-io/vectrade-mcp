"""Shared fixtures for the VecTrade MCP test suite."""

from __future__ import annotations

from pathlib import Path

import pytest


@pytest.fixture()
def tmp_home(tmp_path: Path) -> Path:
    """Return a temporary directory usable as a fake $HOME."""
    return tmp_path


@pytest.fixture()
def valid_api_key() -> str:
    return "vq_live_test1234567890"
