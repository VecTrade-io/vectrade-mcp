"""Tests for vectrade_mcp.cli."""

from __future__ import annotations

from pathlib import Path

import pytest

from vectrade_mcp import cli


def test_resolve_ide_claude_code_alias() -> None:
    assert cli._resolve_ide("claude-code") == "claude-desktop"


def test_resolve_ide_unknown_raises() -> None:
    with pytest.raises(ValueError):
        cli._resolve_ide("unknown-ide")


def test_cmd_setup_single_ide(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_abcdefghijk")

    called: list[str] = []

    def _fake_setup(ide_id: str, api_key: str, *, home: Path | None = None):  # type: ignore[override]
        called.append(ide_id)
        return tmp_path / "mcp.json"

    monkeypatch.setattr(cli, "setup_ide", _fake_setup)

    parser = cli.build_parser()
    args = parser.parse_args(["setup", "claude-code", "--home", str(tmp_path)])
    ret = cli.cmd_setup(args)
    assert ret == 0
    assert called == ["claude-desktop"]


def test_cmd_setup_invalid_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("VECTRADE_API_KEY", "bad_key")
    parser = cli.build_parser()
    args = parser.parse_args(["setup", "cursor"])
    assert cli.cmd_setup(args) == 1


def test_cmd_doctor_rejects_bot_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("VECTRADE_API_KEY", "tvt_example")
    parser = cli.build_parser()
    args = parser.parse_args(["doctor"])
    assert cli.cmd_doctor(args) == 1


def test_cmd_doctor_happy_path(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_abcdefghijk")

    monkeypatch.setattr(cli, "verify_connection", lambda *_args, **_kwargs: {"status": "ok"})

    responses = [
        {"jsonrpc": "2.0", "id": 1, "result": {"serverInfo": {"name": "vectrade-mcp"}}},
        {"jsonrpc": "2.0", "id": 2, "result": {"tools": [{"name": "get_quote"}]}},
    ]

    def _fake_call(_url: str, _key: str, _body: dict, timeout: int = 10):  # noqa: ARG001
        return responses.pop(0)

    monkeypatch.setattr(cli, "_mcp_call", _fake_call)

    parser = cli.build_parser()
    args = parser.parse_args(["doctor"])
    assert cli.cmd_doctor(args) == 0


def test_parse_mcp_setup_namespace() -> None:
    parser = cli.build_parser()
    args = parser.parse_args(["mcp", "setup", "claude-code"])
    assert args.command == "mcp"
    assert args.mcp_command == "setup"


def test_parse_mcp_doctor_namespace() -> None:
    parser = cli.build_parser()
    args = parser.parse_args(["mcp", "doctor"])
    assert args.command == "mcp"
    assert args.mcp_command == "doctor"
