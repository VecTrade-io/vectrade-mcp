"""Tests for configs/ JSON files and package metadata."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import vectrade_mcp

CONFIGS_DIR = Path(__file__).resolve().parent.parent / "configs"
CONFIG_FILES = sorted(CONFIGS_DIR.glob("*.json"))


# ---------------------------------------------------------------------------
# Config JSON validation
# ---------------------------------------------------------------------------


class TestConfigFiles:
    """Every JSON file in configs/ must be parseable and well-formed."""

    @pytest.mark.parametrize(
        "config_file",
        CONFIG_FILES,
        ids=[f.stem for f in CONFIG_FILES],
    )
    def test_valid_json(self, config_file: Path) -> None:
        data = json.loads(config_file.read_text())
        assert isinstance(data, dict)

    @pytest.mark.parametrize(
        "config_file",
        [f for f in CONFIG_FILES if f.stem != "continue-dev"],
        ids=[f.stem for f in CONFIG_FILES if f.stem != "continue-dev"],
    )
    def test_has_mcp_servers_key(self, config_file: Path) -> None:
        data = json.loads(config_file.read_text())
        assert "mcpServers" in data, f"{config_file.name} missing mcpServers"

    @pytest.mark.parametrize(
        "config_file",
        [f for f in CONFIG_FILES if f.stem != "continue-dev"],
        ids=[f.stem for f in CONFIG_FILES if f.stem != "continue-dev"],
    )
    def test_vectrade_server_entry(self, config_file: Path) -> None:
        data = json.loads(config_file.read_text())
        vt = data["mcpServers"]["vectrade"]
        assert vt["command"] == "npx"
        assert "@vectrade/mcp-server" in vt["args"]
        assert "VECTRADE_API_KEY" in vt["env"]

    @pytest.mark.parametrize(
        "config_file",
        [f for f in CONFIG_FILES if f.stem != "continue-dev"],
        ids=[f.stem for f in CONFIG_FILES if f.stem != "continue-dev"],
    )
    def test_no_hardcoded_api_key(self, config_file: Path) -> None:
        """Config files should not contain a real API key."""
        data = json.loads(config_file.read_text())
        key_value = data["mcpServers"]["vectrade"]["env"]["VECTRADE_API_KEY"]
        assert not key_value.startswith("vq_"), (
            f"{config_file.name} contains what looks like a real API key"
        )

    def test_continue_dev_has_models_key(self) -> None:
        path = CONFIGS_DIR / "continue-dev.json"
        if not path.exists():
            pytest.skip("continue-dev.json not found")
        data = json.loads(path.read_text())
        assert "models" in data

    def test_all_expected_configs_exist(self) -> None:
        expected = {
            "claude-desktop",
            "cline",
            "continue-dev",
            "cursor",
            "vscode",
            "windsurf",
        }
        actual = {f.stem for f in CONFIG_FILES}
        assert expected == actual


# ---------------------------------------------------------------------------
# Package metadata
# ---------------------------------------------------------------------------


class TestPackage:
    def test_version_is_set(self) -> None:
        assert vectrade_mcp.__version__
        assert isinstance(vectrade_mcp.__version__, str)

    def test_all_exports(self) -> None:
        assert hasattr(vectrade_mcp, "__all__")
        assert "__version__" in vectrade_mcp.__all__

    def test_py_typed_marker_exists(self) -> None:
        marker = Path(vectrade_mcp.__file__).parent / "py.typed"
        assert marker.exists()
