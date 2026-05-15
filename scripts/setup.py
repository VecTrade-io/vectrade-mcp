#!/usr/bin/env python3
"""VecTrade MCP Interactive Setup Wizard.

Detects installed AI IDEs and configures MCP connections automatically.
"""

import json
import os
import stat
import sys
from pathlib import Path


IDE_CONFIGS = {
    "claude-desktop": {
        "name": "Claude Desktop",
        "paths": {
            "darwin": Path.home() / "Library/Application Support/Claude/claude_desktop_config.json",
            "win32": Path.home() / "AppData/Roaming/Claude/claude_desktop_config.json",
            "linux": Path.home() / ".config/claude/claude_desktop_config.json",
        },
    },
    "cursor": {
        "name": "Cursor",
        "paths": {
            "darwin": Path.home() / ".cursor/mcp.json",
            "win32": Path.home() / ".cursor/mcp.json",
            "linux": Path.home() / ".cursor/mcp.json",
        },
    },
    "vscode": {
        "name": "VS Code (Copilot)",
        "paths": {
            "darwin": Path.home() / ".vscode/mcp.json",
            "win32": Path.home() / ".vscode/mcp.json",
            "linux": Path.home() / ".vscode/mcp.json",
        },
    },
    "windsurf": {
        "name": "Windsurf",
        "paths": {
            "darwin": Path.home() / ".windsurf/mcp.json",
            "win32": Path.home() / ".windsurf/mcp.json",
            "linux": Path.home() / ".windsurf/mcp.json",
        },
    },
}

MCP_CONFIG = {
    "vectrade": {
        "command": "npx",
        "args": ["-y", "@vectrade/mcp-server"],
        "env": {"VECTRADE_API_KEY": ""},
    }
}


def get_platform() -> str:
    if sys.platform == "darwin":
        return "darwin"
    elif sys.platform == "win32":
        return "win32"
    return "linux"


def detect_ides() -> list[str]:
    """Detect which AI IDEs are installed."""
    platform = get_platform()
    detected = []
    for ide_id, ide_info in IDE_CONFIGS.items():
        config_path = ide_info["paths"].get(platform)
        if config_path and (config_path.exists() or config_path.parent.exists()):
            detected.append(ide_id)
    return detected


def validate_api_key(key: str) -> bool:
    """Validate API key format (must start with vq_ and have minimum length)."""
    return key.startswith("vq_") and len(key) >= 10


def setup_ide(ide_id: str, api_key: str) -> None:
    """Configure MCP for a specific IDE."""
    platform = get_platform()
    ide_info = IDE_CONFIGS[ide_id]
    config_path = ide_info["paths"][platform]

    # Read existing config or start fresh
    config: dict = {}
    if config_path.exists():
        try:
            with open(config_path) as f:
                config = json.load(f)
        except (json.JSONDecodeError, OSError) as e:
            print(f"  ⚠ Warning: Could not parse existing config at {config_path}: {e}")
            print("    Creating new config file.")
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

    print(f"  ✓ Configured {ide_info['name']} at {config_path}")


def main() -> None:
    print("🔧 VecTrade MCP Setup Wizard\n")

    # Get API key
    api_key = os.environ.get("VECTRADE_API_KEY", "")
    if not api_key:
        api_key = input("Enter your VecTrade API key (vq_...): ").strip()
        if not api_key:
            print("Error: API key is required.")
            sys.exit(1)

    if not validate_api_key(api_key):
        print("Error: Invalid API key format. Keys must start with 'vq_' and be at least 10 characters.")
        sys.exit(1)

    # Detect IDEs
    detected = detect_ides()
    if not detected:
        print("No supported AI IDEs detected.")
        print("Supported: Claude Desktop, Cursor, VS Code, Windsurf, Cline, Continue")
        sys.exit(1)

    print(f"Detected {len(detected)} IDE(s):\n")
    for ide_id in detected:
        print(f"  • {IDE_CONFIGS[ide_id]['name']}")

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
