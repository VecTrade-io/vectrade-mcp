"""VecTrade MCP unified CLI.

Commands:
- setup: write IDE MCP config files
- doctor: run connectivity and MCP protocol diagnostics
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

from vectrade_mcp.setup_wizard import detect_ides, setup_ide, validate_api_key
from vectrade_mcp.verify import check_api_key, verify_connection

DEFAULT_MCP_URL = "https://mcp.vectrade.io/mcp"
DEFAULT_BASE_URL = "https://api.vectrade.io"

IDE_ALIASES: dict[str, str] = {
    "claude": "claude-desktop",
    "claude-desktop": "claude-desktop",
    "claude-code": "claude-desktop",
    "cursor": "cursor",
    "vscode": "vscode",
    "copilot": "vscode",
    "windsurf": "windsurf",
    "cline": "cline",
    "continue": "continue-dev",
    "continue-dev": "continue-dev",
}


def _resolve_ide(raw: str) -> str:
    ide = IDE_ALIASES.get(raw.lower())
    if not ide:
        supported = ", ".join(sorted(IDE_ALIASES.keys()))
        raise ValueError(f"Unsupported IDE '{raw}'. Supported: {supported}")
    return ide


def _mcp_call(mcp_url: str, api_key: str, body: dict, timeout: int = 10) -> dict:
    req = urllib.request.Request(  # noqa: S310
        mcp_url,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "User-Agent": "vectrade-mcp-doctor/1.0.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:  # noqa: S310
        return json.loads(response.read())


def cmd_setup(args: argparse.Namespace) -> int:
    api_key = args.api_key or os.environ.get("VECTRADE_API_KEY", "")
    if not api_key:
        print("Error: missing API key. Set --api-key or VECTRADE_API_KEY.")
        return 1
    if not validate_api_key(api_key):
        print("Error: API key must start with 'vq_' and be at least 10 characters.")
        return 1

    home = Path(args.home).expanduser() if args.home else Path.home()

    if args.ide.lower() == "all":
        targets = detect_ides(home=home)
        if not targets:
            print("No supported IDEs detected in this environment.")
            return 1
    else:
        targets = [_resolve_ide(args.ide)]

    print(f"Configuring {len(targets)} IDE(s)...")
    for ide in targets:
        setup_ide(ide, api_key, home=home)

    print("Setup complete. Restart your IDE to load VecTrade MCP.")
    return 0


def cmd_doctor(args: argparse.Namespace) -> int:
    api_key = args.api_key or os.environ.get("VECTRADE_API_KEY", "")
    if not api_key:
        try:
            api_key = check_api_key()
        except SystemExit:
            return 1

    print("VecTrade MCP doctor")

    if api_key.startswith("tvt_"):
        print("[FAIL] Detected bot key (tvt_...). MCP requires a VQ key (vq_...).")
        return 1

    if not validate_api_key(api_key):
        print("[FAIL] API key format invalid. Expected prefix 'vq_'.")
        return 1
    print("[OK] API key format")

    try:
        verify_connection(api_key, base_url=args.base_url)
        print("[OK] REST API health and auth")
    except (urllib.error.URLError, OSError) as exc:
        print(f"[FAIL] REST API health/auth: {exc}")
        return 1

    try:
        init_resp = _mcp_call(
            args.mcp_url,
            api_key,
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": "2025-03-26",
                    "clientInfo": {"name": "vectrade-mcp-doctor", "version": "1.0.0"},
                },
            },
        )
        if init_resp.get("error"):
            print(f"[FAIL] MCP initialize: {init_resp['error']}")
            return 1
        print("[OK] MCP initialize")

        tools_resp = _mcp_call(
            args.mcp_url,
            api_key,
            {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/list",
                "params": {},
            },
        )
        tools = tools_resp.get("result", {}).get("tools", [])
        if not isinstance(tools, list) or not tools:
            print("[FAIL] MCP tools/list returned no tools")
            return 1
        print(f"[OK] MCP tools/list ({len(tools)} tools)")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"[FAIL] MCP endpoint HTTP {exc.code}: {body}")
        return 1
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        print(f"[FAIL] MCP endpoint: {exc}")
        return 1

    print("Doctor complete: MCP is ready.")
    return 0


def _add_setup_parser(sub: argparse._SubParsersAction) -> None:
    setup = sub.add_parser("setup", help="Write MCP IDE config")
    setup.add_argument("ide", help="Target IDE (claude-code, cursor, vscode, windsurf, cline, continue, all)")
    setup.add_argument("--api-key", dest="api_key", help="VecTrade API key (vq_...)")
    setup.add_argument("--home", help="Override home directory for config writes")
    setup.set_defaults(func=cmd_setup)


def _add_doctor_parser(sub: argparse._SubParsersAction) -> None:
    doctor = sub.add_parser("doctor", help="Run MCP readiness checks")
    doctor.add_argument("--api-key", dest="api_key", help="VecTrade API key (vq_...)")
    doctor.add_argument("--base-url", default=DEFAULT_BASE_URL, help="REST API base URL")
    doctor.add_argument("--mcp-url", default=DEFAULT_MCP_URL, help="MCP endpoint URL")
    doctor.set_defaults(func=cmd_doctor)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="vectrade", description="VecTrade MCP CLI")
    sub = parser.add_subparsers(dest="command", required=True)

    # Preferred command shape: vectrade mcp <setup|doctor>
    mcp = sub.add_parser("mcp", help="MCP commands")
    mcp_sub = mcp.add_subparsers(dest="mcp_command", required=True)
    _add_setup_parser(mcp_sub)
    _add_doctor_parser(mcp_sub)

    # Backward-compatible shortcuts: vectrade <setup|doctor>
    _add_setup_parser(sub)
    _add_doctor_parser(sub)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    raise SystemExit(main())
