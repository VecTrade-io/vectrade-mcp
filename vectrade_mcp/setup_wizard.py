"""VecTrade MCP Interactive Setup Wizard.

Detects installed AI IDEs and configures MCP connections automatically.
"""

from __future__ import annotations

import json
import os
import stat
import sys
from pathlib import Path

# MCP server configuration template injected into IDE config files.
MCP_SERVER_ENTRY = {
    "command": "npx",
    "args": ["-y", "@vectrade/mcp-server"],
    "env": {"VECTRADE_API_KEY": ""},
}


def _ide_configs(home: Path) -> dict[str, dict]:
    """Return IDE configuration map with paths resolved relative to *home*."""
    return {
        "claude-desktop": {
            "name": "Claude Desktop",
            "paths": {
                "darwin": home / "Library/Application Support/Claude/claude_desktop_config.json",
                "win32": home / "AppData/Roaming/Claude/claude_desktop_config.json",
                "linux": home / ".config/claude/claude_desktop_config.json",
            },
        },
        "cursor": {
            "name": "Cursor",
            "paths": {
                "darwin": home / ".cursor/mcp.json",
                "win32": home / ".cursor/mcp.json",
                "linux": home / ".cursor/mcp.json",
            },
        },
        "vscode": {
            "name": "VS Code (Copilot)",
            "paths": {
                "darwin": home / ".vscode/mcp.json",
                "win32": home / ".vscode/mcp.json",
                "linux": home / ".vscode/mcp.json",
            },
        },
        "windsurf": {
            "name": "Windsurf",
            "paths": {
                "darwin": home / ".windsurf/mcp.json",
                "win32": home / ".windsurf/mcp.json",
                "linux": home / ".windsurf/mcp.json",
            },
        },
        "cline": {
            "name": "Cline",
            "paths": {
                "darwin": home / ".cline/mcp.json",
                "win32": home / ".cline/mcp.json",
                "linux": home / ".cline/mcp.json",
            },
        },
        "continue-dev": {
            "name": "Continue.dev",
            "paths": {
                "darwin": home / ".continue/config.json",
                "win32": home / ".continue/config.json",
                "linux": home / ".continue/config.json",
            },
        },
    }


def get_platform() -> str:
    """Return normalised platform identifier."""
    if sys.platform == "darwin":
        return "darwin"
    if sys.platform == "win32":
        return "win32"
    return "linux"


def detect_ides(home: Path | None = None) -> list[str]:
    """Detect which AI IDEs are installed by checking config paths."""
    if home is None:
        home = Path.home()
    platform = get_platform()
    configs = _ide_configs(home)
    detected: list[str] = []
    for ide_id, ide_info in configs.items():
        config_path = ide_info["paths"].get(platform)
        if config_path and (config_path.exists() or config_path.parent.exists()):
            detected.append(ide_id)
    return detected


def validate_api_key(key: str) -> bool:
    """Validate API key format: must start with ``vq_`` and be ≥ 10 chars."""
    return key.startswith("vq_") and len(key) >= 10


def setup_ide(
    ide_id: str,
    api_key: str,
    *,
    home: Path | None = None,
    _print: object = print,
) -> Path:
    """Configure MCP for a specific IDE.

    Returns the path of the written config file.
    """
    if home is None:
        home = Path.home()
    platform = get_platform()
    configs = _ide_configs(home)

    if ide_id not in configs:
        raise ValueError(f"Unknown IDE: {ide_id}")

    ide_info = configs[ide_id]
    config_path: Path = ide_info["paths"][platform]

    # Read existing config or start fresh
    config: dict = {}
    if config_path.exists():
        try:
            with open(config_path) as f:
                config = json.load(f)
        except (json.JSONDecodeError, OSError) as exc:
            _print(f"  ⚠ Warning: Could not parse existing config at {config_path}: {exc}")
            _print("    Creating new config file.")
            config = {}

    # Add VecTrade MCP server
    if "mcpServers" not in config:
        config["mcpServers"] = {}

    config["mcpServers"]["vectrade"] = {
        "command": "npx",
        "args": ["-y", "@vectrade/mcp-server"],
        "env": {"VECTRADE_API_KEY": api_key},
    }

    # Write config with restricted permissions
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w") as f:
        json.dump(config, f, indent=2)

    # Restrict file permissions (owner read/write only) on Unix systems
    if sys.platform != "win32":
        os.chmod(config_path, stat.S_IRUSR | stat.S_IWUSR)

    _print(f"  ✓ Configured {ide_info['name']} at {config_path}")
    return config_path


def main() -> None:
    """Interactive CLI entry-point."""
    print("🔧 VecTrade MCP Setup Wizard\n")

    # Get API key
    api_key = os.environ.get("VECTRADE_API_KEY", "")
    if not api_key:
        api_key = input("Enter your VecTrade API key (vq_...): ").strip()
        if not api_key:
            print("Error: API key is required.")
            sys.exit(1)

    if not validate_api_key(api_key):
        print(
            "Error: Invalid API key format. "
            "Keys must start with 'vq_' and be at least 10 characters."
        )
        sys.exit(1)

    # Detect IDEs
    detected = detect_ides()
    if not detected:
        print("No supported AI IDEs detected.")
        print("Supported: Claude Desktop, Cursor, VS Code, Windsurf, Cline, Continue.dev")
        sys.exit(1)

    print(f"Detected {len(detected)} IDE(s):\n")
    configs = _ide_configs(Path.home())
    for ide_id in detected:
        print(f"  • {configs[ide_id]['name']}")

    print()
    confirm = input("Configure all? [Y/n]: ").strip().lower()
    if confirm and confirm != "y":
        sys.exit(0)

    print()
    for ide_id in detected:
        setup_ide(ide_id, api_key)

    print("\n✅ Setup complete! Restart your IDE to activate VecTrade tools.")


if __name__ == "__main__":
    main()
