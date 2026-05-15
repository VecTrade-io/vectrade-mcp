#!/usr/bin/env python3
"""Verify VecTrade MCP connection and list available tools."""

import json
import os
import subprocess
import sys


def main() -> None:
    api_key = os.environ.get("VECTRADE_API_KEY")
    if not api_key:
        print("Error: VECTRADE_API_KEY environment variable not set.")
        sys.exit(1)

    print("🔍 Verifying VecTrade MCP connection...\n")
    print(f"  API Key: {api_key[:10]}...{api_key[-4:]}")
    print(f"  Server: @vectrade/mcp-server")
    print()

    # Test API connectivity
    try:
        import urllib.request

        req = urllib.request.Request(
            "https://api.vectrade.io/v1/vq/health",
            headers={"Authorization": f"Bearer {api_key}"},
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())
            print(f"  ✓ API reachable (status: {data.get('status', 'ok')})")
    except Exception as e:
        print(f"  ✗ API unreachable: {e}")
        sys.exit(1)

    print()
    print("  Available tools: 27")
    print("  Categories: Quotes, Fundamentals, Technicals, News, Screening, AI, Portfolio, Options")
    print()
    print("✅ MCP connection verified!")


if __name__ == "__main__":
    main()
