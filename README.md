# VecTrade MCP Integration Kit

[![CI](https://github.com/VecTrade-io/vectrade-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/VecTrade-io/vectrade-mcp/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/VecTrade-io/vectrade-mcp)](LICENSE)

Zero-config setup for VecTrade financial tools in AI IDEs.

**27 financial tools** available in Claude Desktop, Cursor, VS Code Copilot, Windsurf, Cline, and any MCP-compatible client.

## Installation

```bash
pip install .
```

Or install development dependencies for contributing:

```bash
pip install -r requirements.txt
```

## Quick Setup (60 seconds)

### Option 1: Interactive Setup

```bash
python -m vectrade_mcp.setup_wizard
# or, if installed:
vectrade-mcp-setup
```

### Option 2: Manual Configuration

Copy the appropriate config for your IDE:

| IDE | Config File | Status |
|-----|-------------|--------|
| Claude Desktop | [configs/claude-desktop.json](configs/claude-desktop.json) | ✓ |
| Cursor | [configs/cursor.json](configs/cursor.json) | ✓ |
| VS Code (Copilot) | [configs/vscode.json](configs/vscode.json) | ✓ |
| Windsurf | [configs/windsurf.json](configs/windsurf.json) | ✓ |
| Cline | [configs/cline.json](configs/cline.json) | ✓ |
| Continue.dev | [configs/continue-dev.json](configs/continue-dev.json) | ✓ |

### Option 3: CLI Auto-Setup

```bash
vectrade mcp setup cursor
vectrade mcp setup claude
vectrade mcp setup vscode
```

## What You Get

Once configured, your AI assistant can:

- **"What's AAPL trading at?"** → Real-time quotes
- **"Analyze NVDA before earnings"** → AI-powered analysis
- **"Find undervalued large caps with dividend > 3%"** → Stock screening
- **"Show me the AAPL options chain"** → Options data
- **"Compare MSFT vs GOOGL fundamentals"** → Side-by-side comparison

See [TOOLS.md](TOOLS.md) for the full list of 27 available tools.

## Verify Connection

```bash
export VECTRADE_API_KEY=vq_live_...
python -m vectrade_mcp.verify
# or, if installed:
vectrade-mcp-verify
```

## Development

```bash
pip install -r requirements.txt
pytest --cov=vectrade_mcp --cov-report=term-missing
ruff check .
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Requirements

- Node.js 18+ (for `npx` execution)
- VecTrade API key ([get one free](https://app.vectrade.io/keys))

## Documentation

Full docs at [docs.vectrade.io/mcp](https://docs.vectrade.io/sdks/mcp).

## License

MIT — see [LICENSE](LICENSE).
