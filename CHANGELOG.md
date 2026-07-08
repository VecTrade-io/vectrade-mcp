# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-07-08

### Added

- **Unified CLI**: `vectrade mcp setup <ide>` and `vectrade mcp doctor` for seamless setup and diagnostics
  - IDE alias mapping for Claude Code, Cursor, VS Code, Windsurf, Cline, Continue
  - Backward-compatible shortcuts: `vectrade setup` and `vectrade doctor`
  - Bot key (`tvt_`) rejection in both setup and doctor flows
- **Production MCP Smoke Workflow**: Hourly + manual-trigger endpoint validation (`.github/workflows/mcp-smoke-prod.yml`)
  - Validates initialize/tools/list/tools/call protocol
  - Immediate alerts on auth failures or timeouts
- **Marketplace Operational Docs**:
  - `MCP_RUNBOOK.md`: Fast triage matrix and manual smoke commands for support teams
  - `PRIVACY.md`: Key handling and data retention policy
  - `SUPPORT_SLA.md`: Severity tiers and response time targets
  - `CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md`: 8-step release and go-live checklist
- **npm Publish in Release Pipeline**: `publish.yml` now builds and publishes to npm before PyPI
- **Bot Trading Tools**: 6 new MCP tools for AI agent trading (`place_order`, `cancel_order`, `get_orders`, `get_portfolio`, `get_trading_kpi`, `get_bot_account`)
- Bot API authentication via `VECTRADE_BOT_KEY` env var (`tvt_` prefix keys)
- Anthropic skill manifest (`skill.json`) for auto-discovery
- `.well-known/mcp.json` for MCP registry discovery
- Claude Desktop config with trading support (`configs/claude-desktop-trading.json`)
- Comprehensive test suite for trading tools (`tests/trading.test.ts`)
- Marketplace rollout issue template (`.github/ISSUE_TEMPLATE/marketplace-rollout-checklist.md`)

### Fixed

- TypeScript strict mode compliance: Added `isRecord()` type guard for safe JSON narrowing in `api-client.ts`
- Trading portfolio formatter: Output now matches expected format and includes `current_price` field
- Test expectation: Updated config tests to expect `claude-desktop-trading` config

### Changed

- README now documents namespaced setup/doctor commands and compatibility aliases
- Publish pipeline now includes npm publish step for marketplace availability

## [1.0.0] - 2026-05-29

### Added

- Multi-transport support: stdio, SSE, and Streamable HTTP
- Legacy SSE endpoints alongside Streamable HTTP for backward compatibility
- Hosted MCP server deployment with `X-API-Key` forwarding
- Live integration test suite
- Trusted publisher workflow for PyPI
- CI with actions v6

### Fixed

- Forward `X-API-Key` header to VecTrade API for hosted MCP
- Normalize Accept header for broader MCP client compatibility (Hono/node-server)
- Patch `rawHeaders` for Hono Accept header compat

### Changed

- Aligned MCP tools with collector endpoints (latest API paths)

[Unreleased]: https://github.com/VecTrade-io/vectrade-mcp/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/VecTrade-io/vectrade-mcp/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/VecTrade-io/vectrade-mcp/releases/tag/v1.0.0
