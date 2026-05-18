"""Tests for vectrade_mcp.setup_wizard."""

from __future__ import annotations

import json
import stat
import sys
from pathlib import Path

import pytest

from vectrade_mcp.setup_wizard import (
    MCP_SERVER_ENTRY,
    _ide_configs,
    detect_ides,
    get_platform,
    main,
    setup_ide,
    validate_api_key,
)

# ---------------------------------------------------------------------------
# get_platform
# ---------------------------------------------------------------------------


class TestGetPlatform:
    def test_darwin(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "darwin")
        assert get_platform() == "darwin"

    def test_win32(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "win32")
        assert get_platform() == "win32"

    def test_linux(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        assert get_platform() == "linux"

    def test_freebsd_falls_to_linux(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "freebsd13")
        assert get_platform() == "linux"


# ---------------------------------------------------------------------------
# _ide_configs
# ---------------------------------------------------------------------------


class TestIdeConfigs:
    def test_returns_all_ides(self, tmp_home: Path) -> None:
        configs = _ide_configs(tmp_home)
        expected = {"claude-desktop", "cursor", "vscode", "windsurf", "cline", "continue-dev"}
        assert set(configs.keys()) == expected

    def test_all_ides_have_all_platforms(self, tmp_home: Path) -> None:
        configs = _ide_configs(tmp_home)
        for ide_id, info in configs.items():
            for plat in ("darwin", "win32", "linux"):
                assert plat in info["paths"], f"{ide_id} missing {plat}"

    def test_paths_relative_to_home(self, tmp_home: Path) -> None:
        configs = _ide_configs(tmp_home)
        for ide_id, info in configs.items():
            for plat, path in info["paths"].items():
                assert str(path).startswith(str(tmp_home)), (
                    f"{ide_id}/{plat} path not under home: {path}"
                )

    def test_every_ide_has_name(self, tmp_home: Path) -> None:
        configs = _ide_configs(tmp_home)
        for _ide_id, info in configs.items():
            assert "name" in info and isinstance(info["name"], str)


# ---------------------------------------------------------------------------
# validate_api_key
# ---------------------------------------------------------------------------


class TestValidateApiKey:
    def test_valid_key(self) -> None:
        assert validate_api_key("vq_live_abcdef1234") is True

    def test_valid_key_minimum_length(self) -> None:
        assert validate_api_key("vq_1234567") is True  # exactly 10 chars

    def test_missing_prefix(self) -> None:
        assert validate_api_key("live_abcdef1234") is False

    def test_too_short(self) -> None:
        assert validate_api_key("vq_short") is False  # 8 chars

    def test_empty(self) -> None:
        assert validate_api_key("") is False

    def test_prefix_only(self) -> None:
        assert validate_api_key("vq_") is False  # 3 chars

    def test_wrong_prefix(self) -> None:
        assert validate_api_key("ak_live_abcdef1234") is False


# ---------------------------------------------------------------------------
# detect_ides
# ---------------------------------------------------------------------------


class TestDetectIdes:
    def test_no_ides_installed(self, tmp_home: Path) -> None:
        detected = detect_ides(home=tmp_home)
        assert detected == []

    def test_config_file_exists(self, tmp_home: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        # Create the cursor config file
        cursor_dir = tmp_home / ".cursor"
        cursor_dir.mkdir()
        (cursor_dir / "mcp.json").write_text("{}")
        detected = detect_ides(home=tmp_home)
        assert "cursor" in detected

    def test_parent_dir_exists(self, tmp_home: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        # Only parent exists, not the config file itself
        (tmp_home / ".cursor").mkdir()
        detected = detect_ides(home=tmp_home)
        assert "cursor" in detected

    def test_multiple_ides(self, tmp_home: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        (tmp_home / ".cursor").mkdir()
        (tmp_home / ".vscode").mkdir()
        (tmp_home / ".windsurf").mkdir()
        detected = detect_ides(home=tmp_home)
        assert len(detected) >= 3
        assert "cursor" in detected
        assert "vscode" in detected
        assert "windsurf" in detected

    def test_defaults_to_real_home(self, monkeypatch: pytest.MonkeyPatch) -> None:
        """detect_ides() with no args should not crash."""
        detected = detect_ides()
        assert isinstance(detected, list)

    def test_darwin_paths(self, tmp_home: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setattr(sys, "platform", "darwin")
        claude_dir = tmp_home / "Library" / "Application Support" / "Claude"
        claude_dir.mkdir(parents=True)
        detected = detect_ides(home=tmp_home)
        assert "claude-desktop" in detected


# ---------------------------------------------------------------------------
# setup_ide
# ---------------------------------------------------------------------------


class TestSetupIde:
    def test_creates_new_config(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        path = setup_ide("cursor", valid_api_key, home=tmp_home)
        assert path.exists()
        data = json.loads(path.read_text())
        assert data["mcpServers"]["vectrade"]["env"]["VECTRADE_API_KEY"] == valid_api_key

    def test_merges_with_existing_config(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        config_dir = tmp_home / ".cursor"
        config_dir.mkdir()
        existing = {"mcpServers": {"other-server": {"command": "node"}}}
        (config_dir / "mcp.json").write_text(json.dumps(existing))

        setup_ide("cursor", valid_api_key, home=tmp_home)
        data = json.loads((config_dir / "mcp.json").read_text())
        # Original server preserved
        assert "other-server" in data["mcpServers"]
        # VecTrade added
        assert "vectrade" in data["mcpServers"]

    def test_corrupt_existing_config(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch, capsys
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        config_dir = tmp_home / ".cursor"
        config_dir.mkdir()
        (config_dir / "mcp.json").write_text("{invalid json!!!")

        msgs: list[str] = []
        setup_ide("cursor", valid_api_key, home=tmp_home, _print=msgs.append)
        assert any("Warning" in m for m in msgs)
        # Should still write a valid config
        data = json.loads((config_dir / "mcp.json").read_text())
        assert "vectrade" in data["mcpServers"]

    def test_creates_parent_directories(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "darwin")
        path = setup_ide("claude-desktop", valid_api_key, home=tmp_home)
        assert path.exists()
        assert "Claude" in str(path)

    def test_sets_unix_permissions(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        path = setup_ide("cursor", valid_api_key, home=tmp_home)
        mode = path.stat().st_mode
        assert mode & stat.S_IRUSR  # owner read
        assert mode & stat.S_IWUSR  # owner write
        assert not (mode & stat.S_IRGRP)  # no group read
        assert not (mode & stat.S_IROTH)  # no other read

    def test_skips_permissions_on_win32(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "win32")
        # Should not crash on permission setting
        path = setup_ide("cursor", valid_api_key, home=tmp_home)
        assert path.exists()

    def test_unknown_ide_raises(self, tmp_home: Path, valid_api_key: str) -> None:
        with pytest.raises(ValueError, match="Unknown IDE"):
            setup_ide("nonexistent-ide", valid_api_key, home=tmp_home)

    def test_returns_config_path(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        path = setup_ide("vscode", valid_api_key, home=tmp_home)
        assert isinstance(path, Path)
        assert path.name == "mcp.json"

    def test_all_supported_ides(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Every IDE in _ide_configs can be configured without error."""
        monkeypatch.setattr(sys, "platform", "linux")
        configs = _ide_configs(tmp_home)
        for ide_id in configs:
            path = setup_ide(ide_id, valid_api_key, home=tmp_home)
            assert path.exists(), f"Failed for {ide_id}"

    def test_config_has_correct_structure(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        path = setup_ide("cursor", valid_api_key, home=tmp_home)
        data = json.loads(path.read_text())
        vt = data["mcpServers"]["vectrade"]
        assert vt["command"] == "npx"
        assert vt["args"] == ["-y", "@vectrade/mcp-server"]
        assert vt["env"]["VECTRADE_API_KEY"] == valid_api_key

    def test_existing_config_without_mcp_servers_key(
        self, tmp_home: Path, valid_api_key: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        monkeypatch.setattr(sys, "platform", "linux")
        config_dir = tmp_home / ".cursor"
        config_dir.mkdir()
        (config_dir / "mcp.json").write_text(json.dumps({"theme": "dark"}))

        path = setup_ide("cursor", valid_api_key, home=tmp_home)
        data = json.loads(path.read_text())
        assert data["theme"] == "dark"
        assert "vectrade" in data["mcpServers"]


# ---------------------------------------------------------------------------
# MCP_SERVER_ENTRY constant
# ---------------------------------------------------------------------------


class TestMCPServerEntry:
    def test_has_required_fields(self) -> None:
        assert MCP_SERVER_ENTRY["command"] == "npx"
        assert "@vectrade/mcp-server" in MCP_SERVER_ENTRY["args"]
        assert "VECTRADE_API_KEY" in MCP_SERVER_ENTRY["env"]


# ---------------------------------------------------------------------------
# main (interactive CLI)
# ---------------------------------------------------------------------------


class TestMain:
    def test_exits_when_no_api_key(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("VECTRADE_API_KEY", raising=False)
        monkeypatch.setattr("builtins.input", lambda _: "")
        with pytest.raises(SystemExit):
            main()

    def test_exits_on_invalid_key(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "bad_key")
        with pytest.raises(SystemExit):
            main()

    def test_exits_when_no_ides_detected(
        self, monkeypatch: pytest.MonkeyPatch, valid_api_key: str
    ) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", valid_api_key)
        monkeypatch.setattr("vectrade_mcp.setup_wizard.detect_ides", lambda: [])
        with pytest.raises(SystemExit):
            main()

    def test_exits_on_user_decline(
        self, monkeypatch: pytest.MonkeyPatch, valid_api_key: str
    ) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", valid_api_key)
        monkeypatch.setattr("vectrade_mcp.setup_wizard.detect_ides", lambda: ["cursor"])
        monkeypatch.setattr("builtins.input", lambda _: "n")
        with pytest.raises(SystemExit):
            main()

    def test_configures_on_confirm(
        self, monkeypatch: pytest.MonkeyPatch, tmp_home: Path, valid_api_key: str
    ) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", valid_api_key)
        monkeypatch.setattr(sys, "platform", "linux")
        # Create IDE directory so detect_ides finds it
        (tmp_home / ".cursor").mkdir()
        monkeypatch.setattr("vectrade_mcp.setup_wizard.detect_ides", lambda: ["cursor"])
        monkeypatch.setattr("builtins.input", lambda _: "y")
        # Point setup_ide to tmp_home
        original_setup = setup_ide

        def patched_setup(ide_id: str, api_key: str, **kw):
            return original_setup(ide_id, api_key, home=tmp_home)

        monkeypatch.setattr("vectrade_mcp.setup_wizard.setup_ide", patched_setup)
        main()  # should not raise
        config_file = tmp_home / ".cursor" / "mcp.json"
        assert config_file.exists()

    def test_prompts_for_key_when_env_not_set(
        self, monkeypatch: pytest.MonkeyPatch, tmp_home: Path, valid_api_key: str
    ) -> None:
        monkeypatch.delenv("VECTRADE_API_KEY", raising=False)
        inputs = iter([valid_api_key, "y"])
        monkeypatch.setattr("builtins.input", lambda _: next(inputs))
        monkeypatch.setattr(sys, "platform", "linux")
        (tmp_home / ".cursor").mkdir()
        monkeypatch.setattr("vectrade_mcp.setup_wizard.detect_ides", lambda: ["cursor"])
        original_setup = setup_ide

        def patched_setup(ide_id: str, api_key: str, **kw):
            return original_setup(ide_id, api_key, home=tmp_home)

        monkeypatch.setattr("vectrade_mcp.setup_wizard.setup_ide", patched_setup)
        main()
        config_file = tmp_home / ".cursor" / "mcp.json"
        assert config_file.exists()

    def test_default_confirm_is_yes(
        self, monkeypatch: pytest.MonkeyPatch, tmp_home: Path, valid_api_key: str
    ) -> None:
        """Pressing Enter (empty input) at the confirm prompt proceeds."""
        monkeypatch.setenv("VECTRADE_API_KEY", valid_api_key)
        monkeypatch.setattr(sys, "platform", "linux")
        (tmp_home / ".cursor").mkdir()
        monkeypatch.setattr("vectrade_mcp.setup_wizard.detect_ides", lambda: ["cursor"])
        monkeypatch.setattr("builtins.input", lambda _: "")
        original_setup = setup_ide

        def patched_setup(ide_id: str, api_key: str, **kw):
            return original_setup(ide_id, api_key, home=tmp_home)

        monkeypatch.setattr("vectrade_mcp.setup_wizard.setup_ide", patched_setup)
        main()  # empty confirm = yes, should not raise
