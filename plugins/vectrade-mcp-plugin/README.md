# VecTrade MCP Claude Plugin

This plugin bundles:

- VecTrade MCP connector configuration via `.mcp.json`
- VecTrade Claude skill at `skills/vectrade/SKILL.md`

## Required environment variables

- `VECTRADE_API_KEY` (required): user key with `vq_` prefix
- `VECTRADE_BOT_KEY` (optional): bot key with `tvt_` prefix for trading tools

## Verify after install

Run in Claude Code:

- Ask: `Use get_quote for AAPL and summarize in 3 bullets.`
- Or run: `vectrade mcp doctor`
