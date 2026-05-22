"""Tests for vectrade_mcp.verify."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from vectrade_mcp.verify import (
    _API_BASE,
    _HEALTH_PATH,
    _TIMEOUT,
    check_api_key,
    main,
    mask_key,
    verify_connection,
)

# ---------------------------------------------------------------------------
# mask_key
# ---------------------------------------------------------------------------


class TestMaskKey:
    def test_long_key(self) -> None:
        key = "vq_live_abcdef1234567890"
        masked = mask_key(key)
        assert masked.startswith("vq_live_ab")
        assert masked.endswith("7890")
        assert "..." in masked

    def test_short_key(self) -> None:
        masked = mask_key("vq_1234567")
        assert masked == "vq_1***"

    def test_very_short_key(self) -> None:
        masked = mask_key("vq_x")
        assert masked == "vq_x***"

    def test_exact_boundary(self) -> None:
        # 14 chars — should use short form
        masked = mask_key("vq_12345678901")
        assert masked == "vq_1***"

    def test_15_chars(self) -> None:
        # 15 chars — should use long form
        masked = mask_key("vq_123456789012")
        assert "..." in masked


# ---------------------------------------------------------------------------
# check_api_key
# ---------------------------------------------------------------------------


class TestCheckApiKey:
    def test_returns_key_from_env(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_test123")
        assert check_api_key() == "vq_live_test123"

    def test_exits_when_not_set(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("VECTRADE_API_KEY", raising=False)
        with pytest.raises(SystemExit):
            check_api_key()


# ---------------------------------------------------------------------------
# verify_connection
# ---------------------------------------------------------------------------


class TestVerifyConnection:
    def _mock_urlopen(self, body: dict, status: int = 200):
        """Create a mock for urllib.request.urlopen."""
        response = MagicMock()
        response.read.return_value = json.dumps(body).encode()
        response.__enter__ = MagicMock(return_value=response)
        response.__exit__ = MagicMock(return_value=False)
        return response

    def test_success(self) -> None:
        body = {"status": "ok", "version": "1.0"}
        mock_resp = self._mock_urlopen(body)
        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_open:
            result = verify_connection("vq_test_key")
            assert result == body
            # Verify the request was made with correct auth header
            call_args = mock_open.call_args
            req = call_args[0][0]
            assert req.get_header("X-api-key") == "vq_test_key"

    def test_custom_base_url(self) -> None:
        body = {"status": "ok"}
        mock_resp = self._mock_urlopen(body)
        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_open:
            verify_connection("key", base_url="https://staging.api.vectrade.io")
            req = mock_open.call_args[0][0]
            assert "staging.api.vectrade.io" in req.full_url

    def test_custom_timeout(self) -> None:
        body = {"status": "ok"}
        mock_resp = self._mock_urlopen(body)
        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_open:
            verify_connection("key", timeout=5)
            assert mock_open.call_args[1]["timeout"] == 5

    def test_network_error_propagates(self) -> None:
        with (
            patch("urllib.request.urlopen", side_effect=OSError("Connection refused")),
            pytest.raises(OSError, match="Connection refused"),
        ):
            verify_connection("key")

    def test_url_includes_health_path(self) -> None:
        body = {"status": "ok"}
        mock_resp = self._mock_urlopen(body)
        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_open:
            verify_connection("key")
            req = mock_open.call_args[0][0]
            assert req.full_url.endswith(_HEALTH_PATH)


# ---------------------------------------------------------------------------
# Module constants
# ---------------------------------------------------------------------------


class TestConstants:
    def test_api_base_is_https(self) -> None:
        assert _API_BASE.startswith("https://")

    def test_health_path_starts_with_slash(self) -> None:
        assert _HEALTH_PATH.startswith("/")

    def test_timeout_is_positive(self) -> None:
        assert _TIMEOUT > 0


# ---------------------------------------------------------------------------
# main (interactive CLI)
# ---------------------------------------------------------------------------


class TestMain:
    def test_exits_without_api_key(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.delenv("VECTRADE_API_KEY", raising=False)
        with pytest.raises(SystemExit):
            main()

    def test_success_path(self, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_test1234567890")
        with patch(
            "vectrade_mcp.verify.verify_connection",
            return_value={"status": "healthy"},
        ):
            main()
        captured = capsys.readouterr()
        assert "API reachable" in captured.out
        assert "status: healthy" in captured.out
        assert "MCP connection verified" in captured.out

    def test_api_unreachable(self, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_test1234567890")
        with (
            patch(
                "vectrade_mcp.verify.verify_connection",
                side_effect=OSError("timeout"),
            ),
            pytest.raises(SystemExit),
        ):
            main()
        captured = capsys.readouterr()
        assert "API unreachable" in captured.out

    def test_displays_masked_key(self, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_test1234567890")
        with patch(
            "vectrade_mcp.verify.verify_connection",
            return_value={"status": "ok"},
        ):
            main()
        captured = capsys.readouterr()
        # Should show masked key, not full key
        assert "vq_live_te" in captured.out
        assert "7890" in captured.out

    def test_default_status_when_missing(self, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_test1234567890")
        with patch(
            "vectrade_mcp.verify.verify_connection",
            return_value={},  # no "status" key
        ):
            main()
        captured = capsys.readouterr()
        assert "status: ok" in captured.out  # falls back to "ok"

    def test_prints_tool_count(self, monkeypatch: pytest.MonkeyPatch, capsys) -> None:
        monkeypatch.setenv("VECTRADE_API_KEY", "vq_live_test1234567890")
        with patch(
            "vectrade_mcp.verify.verify_connection",
            return_value={"status": "ok"},
        ):
            main()
        captured = capsys.readouterr()
        assert "27" in captured.out
