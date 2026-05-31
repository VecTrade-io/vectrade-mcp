# VecTrade MCP Integration Kit

[![CI](https://github.com/VecTrade-io/vectrade-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/VecTrade-io/vectrade-mcp/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/VecTrade-io/vectrade-mcp)](LICENSE)

Zero-config setup for VecTrade financial tools in AI IDEs.

**27 financial tools** available in Claude Desktop, Cursor, VS Code Copilot, Windsurf, Cline, and any MCP-compatible client.

## Installation

```bash
pip install vectrade-mcp
```

Or with [uvx](https://docs.astral.sh/uv/):

```bash
uvx vectrade-mcp-setup
```

For development:

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
- **"Buy 10 shares of AAPL"** → AI agent trading (Bot API)
- **"How's my portfolio doing?"** → Portfolio & KPI tracking

See [TOOLS.md](TOOLS.md) for the full list of available tools.

## AI Agent Trading (NEW)

Give your AI assistant a trading account! With a Bot API key (`tvt_...`), Claude/GPT can autonomously place orders, manage portfolios, and compete on the leaderboard.

```json
{
  "mcpServers": {
    "vectrade": {
      "command": "npx",
      "args": ["-y", "@vectrade/mcp-server"],
      "env": {
        "VECTRADE_API_KEY": "vq_live_...",
        "VECTRADE_BOT_KEY": "tvt_your_bot_key"
      }
    }
  }
}
```

Trading tools: `place_order`, `cancel_order`, `get_orders`, `get_portfolio`, `get_trading_kpi`, `get_bot_account`

See [guides/bot-trading](https://docs.vectrade.io/guides/bot-trading) for full docs.

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
- VecTrade API key ([get one free](https://vectrade.io/vtrade/developer))

## Hosted MCP (Zero Install)

Use VecTrade's hosted MCP server — no local setup needed. Just add the remote URL to your IDE config:

**Streamable HTTP (recommended):**
```json
{
  "mcpServers": {
    "vectrade": {
      "url": "https://mcp.vectrade.io/mcp",
      "headers": {
        "X-API-Key": "vq_live_..."
      }
    }
  }
}
```

**Legacy SSE:**
```json
{
  "mcpServers": {
    "vectrade": {
      "url": "https://mcp.vectrade.io/sse",
      "headers": {
        "X-API-Key": "vq_live_..."
      }
    }
  }
}
```

The hosted server uses the same API key authentication and plan limits as the REST API.

## Self-Hosting

To run the MCP server on your own infrastructure:

```bash
# Build and run
npm run build
PORT=3200 VECTRADE_API_KEY=vq_live_... npm start         # Streamable HTTP
PORT=3200 VECTRADE_API_KEY=vq_live_... npm run start:sse  # Legacy SSE

# Docker
docker build -t vectrade-mcp .
docker run -p 3200:3200 -e VECTRADE_API_KEY=vq_live_... vectrade-mcp
```

## Documentation

Full docs at [docs.vectrade.io/mcp](https://docs.vectrade.io/sdks/mcp).

## Community

- 💬 [Discord](https://discord.gg/vectrade) — Get help, share prompts, discuss MCP workflows
- 📖 [MCP Directory](https://modelcontextprotocol.io) — Discover other MCP servers
- 🐍 [finkit](https://github.com/VecTrade-io/finkit) — Open-source indicators library (no API key needed)
- ⭐ Star this repo to help others find it!

## License

MIT — see [LICENSE](LICENSE).
