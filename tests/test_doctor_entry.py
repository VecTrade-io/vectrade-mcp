"""Tests for vectrade_mcp.doctor entrypoint wrapper."""

from __future__ import annotations

from vectrade_mcp import doctor


def test_doctor_main_delegates_to_cli(monkeypatch) -> None:
    captured: dict[str, list[str]] = {}

    def _fake_cli_main(argv: list[str]) -> int:
        captured["argv"] = argv
        return 7

    monkeypatch.setattr(doctor, "cli_main", _fake_cli_main)
    assert doctor.main() == 7
    assert captured["argv"] == ["doctor"]
