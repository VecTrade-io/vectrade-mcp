"""Entry-point wrapper for doctor command."""

from __future__ import annotations

from vectrade_mcp.cli import main as cli_main


def main() -> int:
    return cli_main(["doctor"])


if __name__ == "__main__":
    raise SystemExit(main())
