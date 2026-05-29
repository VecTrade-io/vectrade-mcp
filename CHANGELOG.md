# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
