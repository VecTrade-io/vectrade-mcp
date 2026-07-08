# Claude Code Marketplace Submission Guide

This is the practical, end-to-end checklist to publish VecTrade MCP for Claude Code users.

## 1. Release Preconditions

- MCP smoke in production passes from GitHub Actions (`mcp-smoke-prod.yml`)
- UAT smoke passes for all core MCP methods (`initialize`, `tools/list`, `tools/call`)
- `vectrade mcp setup claude-code` and `vectrade mcp doctor` documented and tested
- Security, privacy, and support docs are published:
  - `SECURITY.md`
  - `PRIVACY.md`
  - `SUPPORT_SLA.md`
  - `MCP_RUNBOOK.md`

## 2. GitHub Secrets and Workflow Setup

Configure these repository secrets:

- `NPM_TOKEN` for npm publish
- `VECTRADE_PROD_MCP_API_KEY` for production MCP smoke

Verify workflows:

- `.github/workflows/publish.yml`
- `.github/workflows/mcp-smoke-prod.yml`

## 3. Package Publishing

### npm package (Claude Code local connector path)

1. Bump package version in `package.json`.
2. Update `CHANGELOG.md` release section.
3. Tag and push:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

4. Confirm publish workflow completed:
- npm publish succeeded
- PyPI publish succeeded
- GitHub release created

## 4. Claude Code Listing Metadata

Prepare and keep these assets ready:

- Name: VecTrade MCP
- Short description: Financial market data and trading tools for Claude Code via MCP
- Long description: include hosted mode + local mode + key requirements
- Categories/keywords: finance, trading, stocks, markets, MCP
- Support URL: GitHub issues or support portal
- Privacy URL: `PRIVACY.md` (or hosted docs equivalent)
- Security URL: `SECURITY.md` (or hosted docs equivalent)

## 5. Connection Modes to Advertise

### Recommended: Hosted MCP

Use endpoint:

- `https://mcp.vectrade.io/mcp`

Required header:

- `X-API-Key: vq_...`

### Fallback: Local connector

Use CLI:

```bash
vectrade mcp setup claude-code
vectrade mcp doctor
```

## 6. Submission Content Checklist

- 60-90 second setup demo video
- 3 reproducible prompts (quote lookup, screener, analysis)
- Troubleshooting notes:
  - `tvt_` bot key is not valid for MCP auth
  - paid plan requirement for MCP access
  - quota/rate-limit behavior

## 7. Post-Submission Operations

- Run `mcp-smoke-prod.yml` hourly and monitor failures
- Track:
  - initialize success rate
  - tools/list success rate
  - tools/call error rate
  - p95 latency
- Keep rollback path ready:
  - disable listing install recommendation
  - direct users to hosted fallback docs

## 8. Go-Live Criteria

- 7 consecutive days of green production smoke checks
- No Sev-1 auth or key handling incidents
- Marketplace reviewer feedback resolved
- Support owner on-call for first launch week
