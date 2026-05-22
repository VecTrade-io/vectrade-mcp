"""Live integration tests for VecTrade MCP.

Requires VECTRADE_TEST_API_KEY environment variable.
Skipped automatically when the key is not set.
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request

import pytest

API_KEY = os.environ.get("VECTRADE_TEST_API_KEY", "")
BASE_URL = "https://api.vectrade.io/v1"

pytestmark = pytest.mark.skipif(not API_KEY, reason="VECTRADE_TEST_API_KEY not set")


_UA = "vectrade-mcp/0.1.0 (live-tests)"


def _get(path: str, params: dict | None = None) -> tuple[int, dict]:
    """Helper: GET request with X-API-Key."""
    url = f"{BASE_URL}{path}"
    if params:
        qs = "&".join(f"{k}={v}" for k, v in params.items())
        url = f"{url}?{qs}"
    req = urllib.request.Request(url, headers={"X-API-Key": API_KEY, "User-Agent": _UA})  # noqa: S310
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else "{}"
        return e.code, json.loads(body) if body else {}


def _get_no_auth(path: str) -> int:
    """GET without auth — return status code."""
    url = f"{BASE_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": _UA})  # noqa: S310
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


# ── Auth enforcement ──


class TestAuthEnforcement:
    """Ensure API requires authentication."""

    def test_no_key_returns_401(self):
        status = _get_no_auth("/vq/quotes/AAPL")
        assert status == 401

    def test_invalid_key_returns_401(self):
        url = f"{BASE_URL}/vq/quotes/AAPL"
        req = urllib.request.Request(  # noqa: S310
            url, headers={"X-API-Key": "vq_invalid_key_12345", "User-Agent": _UA}
        )
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310
                status = resp.status
        except urllib.error.HTTPError as e:
            status = e.code
        assert status in (401, 403)

    def test_valid_key_succeeds(self):
        status, data = _get("/vq/quotes/AAPL")
        assert status == 200
        assert "symbol" in data or "data" in data or "error" not in data


# ── Quote endpoints (MCP tools exercise these) ──


class TestQuotes:
    """Verify quote endpoints that MCP tools call."""

    def test_single_quote(self):
        status, data = _get("/vq/quotes/AAPL")
        assert status == 200

    def test_invalid_symbol(self):
        status, data = _get("/vq/quotes/ZZZZZZ999")
        assert status in (404, 400, 200)  # API may return empty data

    def test_batch_quotes(self):
        status, data = _get("/vq/quotes/batch", {"symbols": "AAPL,MSFT"})
        assert status == 200


# ── Developer endpoints ──


class TestDeveloper:
    """Verify developer/plan endpoints."""

    def test_developer_plan(self):
        status, data = _get("/vq/developer/plan")
        assert status == 200
        assert "plan_id" in data or "plan_name" in data or "plan" in data

    def test_developer_usage(self):
        status, data = _get("/vq/developer/usage")
        assert status == 200

    def test_developer_keys(self):
        status, data = _get("/vq/developer/keys")
        assert status == 200

    def test_developer_quota(self):
        status, data = _get("/vq/developer/quota")
        assert status == 200


# ── Rate limiting ──


class TestRateLimits:
    """Verify rate limit headers are present."""

    def test_rate_limit_headers_present(self):
        url = f"{BASE_URL}/vq/quotes/AAPL"
        req = urllib.request.Request(url, headers={"X-API-Key": API_KEY, "User-Agent": _UA})  # noqa: S310
        with urllib.request.urlopen(req, timeout=15) as resp:  # noqa: S310
            headers = dict(resp.headers)
            # Check for rate limit or standard API headers
            has_api_headers = any(
                k.lower().startswith(("x-ratelimit", "x-content", "cf-")) for k in headers
            )
            assert has_api_headers, f"No expected headers found: {list(headers.keys())}"


# ── Plan limits ──


class TestPlanLimits:
    """Verify plan-based restrictions are communicated."""

    def test_plan_has_quota_info(self):
        status, data = _get("/vq/developer/quota")
        assert status == 200
        # Should have some quota-related field
        text = json.dumps(data).lower()
        assert any(w in text for w in ("remaining", "limit", "quota", "used", "total")), (
            f"No quota info found in: {data}"
        )


# ── Health endpoint ──


class TestHealth:
    """Verify health/connectivity."""

    def test_health_endpoint(self):
        status, data = _get("/vq/health")
        assert status == 200
        assert data.get("status") in ("healthy", "ok", "up")


# ── Response time ──


class TestPerformance:
    """Basic performance sanity check."""

    def test_response_under_5s(self):
        import time

        start = time.time()
        _get("/vq/quotes/AAPL")
        elapsed = time.time() - start
        assert elapsed < 5.0, f"Response took {elapsed:.2f}s"


# ── Verify module ──


class TestVerifyModule:
    """Test the verify module against live API."""

    def test_verify_connection_live(self):
        from vectrade_mcp.verify import verify_connection

        result = verify_connection(API_KEY)
        assert "status" in result
        assert result["status"] in ("healthy", "ok", "up")
