#!/usr/bin/env python3
"""Verify VecTrade MCP connection and list available tools.

Thin entry-point — all logic lives in :mod:`vectrade_mcp.verify`.
"""

from vectrade_mcp.verify import main

if __name__ == "__main__":
    main()
