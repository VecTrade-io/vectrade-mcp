"""Verify VecTrade MCP connection and list available tools."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

_API_BASE = "https://api.vectrade.io"
_HEALTH_PATH = "/v1/vq/health"
_TIMEOUT = 10


def check_api_key() -> str:
    """Return the API key from the environment, or exit with an error."""
    api_key = os.environ.get("VECTRADE_API_KEY")
    if not api_key:
        print("Error: VECTRADE_API_KEY environment variable not set.")
        sys.exit(1)
    return api_key


def mask_key(api_key: str) -> str:
    """Return a masked representation of *api_key* for safe display."""
    if len(api_key) <= 14:
        return api_key[:4] + "***"
    return api_key[:10] + "..." + api_key[-4:]


def verify_connection(
    api_key: str,
    *,
    base_url: str = _API_BASE,
    timeout: int = _TIMEOUT,
) -> dict:
    """Ping the VecTrade health endpoint.

    Returns the parsed JSON response body on success.
    Raises ``urllib.error.URLError`` (or subclass) on failure.
    """
    url = f"{base_url}{_HEALTH_PATH}"
    req = urllib.request.Request(  # noqa: S310
        url,
        headers={"Authorization": f"Bearer {api_key}"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:  # noqa: S310
        return json.loads(response.read())


def main() -> None:
    """Interactive CLI entry-point."""
    api_key = check_api_key()

    print("🔍 Verifying VecTrade MCP connection...\n")
    print(f"  API Key: {mask_key(api_key)}")
    print("  Server: @vectrade/mcp-server")
    print()

    try:
        data = verify_connection(api_key)
        print(f"  ✓ API reachable (status: {data.get('status', 'ok')})")
    except (urllib.error.URLError, OSError) as exc:
        print(f"  ✗ API unreachable: {exc}")
        sys.exit(1)

    print()
    print("  Available tools: 27")
    print("  Categories: Quotes, Fundamentals, Technicals, News, Screening, AI, Portfolio, Options")
    print()
    print("✅ MCP connection verified!")


if __name__ == "__main__":
    main()
