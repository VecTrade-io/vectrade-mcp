# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Bot Trading Tools**: 6 new MCP tools for AI agent trading (`place_order`, `cancel_order`, `get_orders`, `get_portfolio`, `get_trading_kpi`, `get_bot_account`)
- Bot API authentication via `VECTRADE_BOT_KEY` env var (`tvt_` prefix keys)
- Anthropic skill manifest (`skill.json`) for auto-discovery
- `.well-known/mcp.json` for MCP registry discovery
- Claude Desktop config with trading support (`configs/claude-desktop-trading.json`)
- Comprehensive test suite for trading tools (`tests/trading.test.ts`)

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

[Unreleased]: https://github.com/VecTrade-io/vectrade-mcp/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/VecTrade-io/vectrade-mcp/releases/tag/v1.0.0
