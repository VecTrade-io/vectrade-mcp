# Release: VecTrade MCP vX.Y.Z — Claude Code Marketplace Ready

## Overview

Ship VecTrade MCP as a production-ready marketplace integration for Claude Code users, with complete MCP protocol implementation, operational runbooks, and marketplace compliance documentation.

## Changes

### Core Implementation

#### 1. Unified CLI for Setup & Diagnostics
- **File**: `vectrade_mcp/cli.py` (new)
- **File**: `vectrade_mcp/doctor.py` (new)
- **Details**:
  - Namespaced CLI: `vectrade mcp setup <ide>` and `vectrade mcp doctor`
  - IDE aliases for Claude Code (`claude-code` → `claude-desktop`)
  - Setup flow: key validation → IDE config write
  - Doctor flow: key format check → REST health → MCP initialize/tools/list validation
  - Backward-compatible shortcuts: `vectrade setup ...` and `vectrade doctor`
- **Entrypoints** in `pyproject.toml`: `vectrade`, `vectrade-mcp-doctor`

#### 2. Production MCP Smoke Workflow
- **File**: `.github/workflows/mcp-smoke-prod.yml` (new)
- **Trigger**: Hourly schedule + manual `workflow_dispatch`
- **Tests**:
  - Secret validation (must be `vq_...`, not `tvt_...`)
  - MCP initialize against production endpoint
  - tools/list returns ≥ 1 tool
  - tools/call succeeds on `search_assets`
- **Signals failures** immediately if any step fails

#### 3. Release Pipeline with npm Publish
- **File**: `.github/workflows/publish.yml`
- **Changes**:
  - Added Node setup and npm build step
  - Publish to npm before PyPI
  - Preserves existing PyPI and GitHub release steps
  - Requires `NPM_TOKEN` secret

#### 4. Marketplace Operational & Policy Docs
- **File**: `MCP_RUNBOOK.md` (new)
  - Fast triage matrix (401, 403, `tvt_` key, timeouts, etc.)
  - Manual smoke curl commands
  - Escalation template
  
- **File**: `PRIVACY.md` (new)
  - What we process / what we don't
  - Key handling policy
  - Data retention windows
  - Contact for privacy questions

- **File**: `SUPPORT_SLA.md` (new)
  - Severity tiers (Sev-1 to Sev-4)
  - Target response times
  - Availability objective (99.9% hosted)

- **File**: `CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md` (new)
  - 8-step checklist from release to go-live
  - Secret setup requirements
  - Listing metadata template
  - Connection modes (hosted vs local)
  - Post-submission operations
  - Go-live criteria (7 days green + no Sev-1 + reviewer feedback)

#### 5. Documentation Updates
- **File**: `README.md`
  - Added new CLI commands at top of install section
  - Documented compatibility aliases
  - Updated verify section to use `vectrade mcp doctor`
  - Linked new operational docs

- **File**: `CHANGELOG.md`
  - Documented all new CLI, workflow, and doc additions

### Bug Fixes & Strictness

#### TypeScript Strict Mode Compliance
- **File**: `src/utils/api-client.ts`
  - Added `isRecord()` type guard
  - Removed unused `APIResponse` and `APIError` interfaces
  - Fixed `unknown` type narrowing for error handling
  
- **File**: `src/tools/news.ts`
  - Removed unused `formatGeneric` import

#### Trading Tools Format Fix
- **File**: `src/tools/trading.ts`
  - Fixed `formatPortfolio()` to include `current_price` field
  - Normalized symbol output format for test compatibility
  - Added defensive null coalescing for position fields

#### Test Expectation Update
- **File**: `tests/test_configs.py`
  - Updated expected config set to include `claude-desktop-trading`

### Metadata Updates
- **File**: `package.json`
  - Version: vX.Y.Z
  - Keywords: added "claude-code", "mcp"
  
- **File**: `pyproject.toml`
  - Version: vX.Y.Z
  - Scripts: added `vectrade-mcp-doctor` console entry

## Validation

### Local Test Results
- **Python**: 99 passed, 15 skipped (all green)
- **TypeScript**: No typecheck errors
- **Node tests**: 35 passed, 3 skipped (all green)
- **Compatibility check**: Config shape valid, skill manifest present

### UAT Deployment Results
- **Deploy status**: Successful (39s downtime)
- **Services**: All 4 UAT services healthy post-deploy
- **MCP endpoint**: Unauthenticated → 401 (auth enforced) ✓
- **Authenticated smoke**: 
  - initialize: ✓
  - tools/list: 42 tools ✓
  - tools/call (search_assets): ✓

## Marketplace Readiness

- ✓ Setup command: `vectrade mcp setup claude-code`
- ✓ Doctor command: `vectrade mcp doctor`
- ✓ Production MCP smoke: Hourly + manual
- ✓ Security policy documented
- ✓ Privacy policy documented
- ✓ Support SLA documented
- ✓ MCP troubleshooting runbook
- ✓ Submission checklist and guide
- ✓ Hosted + local connector modes supported
- ✓ Key-type validation (reject `tvt_` keys)
- ✓ Backward compatibility maintained

## Release Instructions

1. **Prepare** (local):
   ```bash
   # Update version in package.json and pyproject.toml
   # Update CHANGELOG.md with release entry
   git add -A
   git commit -m "chore(release): vX.Y.Z"
   ```

2. **Tag & Push**:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```

3. **Monitor CI**:
   - Confirm `.github/workflows/publish.yml` completes
   - Verify npm publish + PyPI publish + GitHub release all succeed

4. **Marketplace Submission**:
   - Follow checklist in `CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md`
   - Ensure `VECTRADE_PROD_MCP_API_KEY` secret is set
   - Run production smoke workflow manually to validate

## Post-Release

- Production MCP smoke runs hourly — monitor for failures
- Support team alerted on Sev-1 incidents (MCP auth, key handling)
- Rollback path documented in `CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md`

---

**Release Coordinator**: [Your Name]  
**Date**: 2026-07-08  
**Branch**: `main`  
**Breaking Changes**: None
