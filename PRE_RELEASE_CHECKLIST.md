# Pre-Release Validation Checklist

Run this checklist before cutting the release tag. All items must pass (✓) or be documented.

## 1. Repository State
- [ ] Working directory clean: `git status --short` shows no uncommitted changes (only new files for release)
- [ ] Latest from remote: `git fetch origin && git diff origin/main`
- [ ] Branch is `main` or release branch
- [ ] All changes committed and reviewed

**Status**: ___________

## 2. Code Quality

### Python
- [ ] Tests pass: `pytest -q` → all pass or skip only (no failures)
- [ ] Coverage maintained: `pytest --cov=vectrade_mcp --cov-report=term-missing`

### TypeScript/Node
- [ ] Typecheck passes: `npm run typecheck` → no errors
- [ ] Tests pass: `npm run test` → all pass
- [ ] Build succeeds: `npm run build` → no errors
- [ ] Lint passes: `npm run lint` → no issues

### CLI
- [ ] Setup command works: `vectrade mcp setup --help` → shows usage
- [ ] Doctor command works: `vectrade mcp doctor --help` → shows usage
- [ ] Alias resolution: test both `vectrade setup ...` and `vectrade mcp setup ...`

**Status**: ___________

## 3. Documentation

- [ ] README.md links all new docs (RUNBOOK, PRIVACY, SUPPORT, GUIDE)
- [ ] CHANGELOG.md has release section with version and date
- [ ] MCP_RUNBOOK.md complete with triage matrix and manual smoke commands
- [ ] PRIVACY.md exists and addresses key handling
- [ ] SUPPORT_SLA.md has severity tiers and response targets
- [ ] CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md has 8-step checklist
- [ ] All markdown files have no broken internal links

**Status**: ___________

## 4. GitHub Workflows

### Publish Workflow
- [ ] File `.github/workflows/publish.yml` exists
- [ ] Node setup step present (lines 18-21)
- [ ] npm build step present (lines 26-27)
- [ ] npm publish step present (lines 29-32) with `NODE_AUTH_TOKEN`
- [ ] PyPI publish step still present (lines 44-45)
- [ ] GitHub release step still present (lines 47-51)

### MCP Smoke Workflow
- [ ] File `.github/workflows/mcp-smoke-prod.yml` exists
- [ ] Trigger: `workflow_dispatch` and cron schedule (line 5-6)
- [ ] Secret validation step (lines 21-32)
- [ ] MCP initialize test (lines 34-49)
- [ ] tools/list test (lines 51-71)
- [ ] tools/call test (lines 73-88)

**Status**: ___________

## 5. Repository Secrets (Required before release)

In GitHub Settings → Secrets and variables → Actions:

- [ ] `NPM_TOKEN` exists and is valid (will be used during publish)
- [ ] `VECTRADE_PROD_MCP_API_KEY` exists and has `vq_` prefix (not `tvt_`)
- [ ] Both secrets are accessible to `.github/workflows/` workflows

**How to verify**:
```bash
# Can't check from CLI, but GitHub Actions will fail if missing
# Check manually in GitHub UI: 
# https://github.com/VecTrade-io/vectrade-mcp/settings/secrets/actions
```

**Status**: ___________

## 6. Version & Package Metadata

### package.json
- [ ] Version bumped to X.Y.Z
- [ ] Name is `@vectrade/mcp-server`
- [ ] Main entry points are correct
- [ ] Bin entries include `vectrade-mcp-server`

### pyproject.toml
- [ ] Version bumped to X.Y.Z (match package.json)
- [ ] Scripts section has entry for `vectrade`
- [ ] Scripts section has entry for `vectrade-mcp-doctor`
- [ ] Dependencies unchanged or documented

### CHANGELOG.md
- [ ] Release section header: `## [X.Y.Z] — YYYY-MM-DD` (not `[Unreleased]`)
- [ ] Section contains all changes (CLI, workflows, docs)
- [ ] Previous release link at bottom points to correct tag

**Status**: ___________

## 7. Build & Package Output

- [ ] `npm run build` completes without errors
- [ ] `dist/` directory contains compiled output
- [ ] `python -m build` completes without errors
- [ ] `dist/` directory contains `.whl` and `.tar.gz`

**Status**: ___________

## 8. UAT Verification (Already passed, confirm still valid)

- [ ] UAT services are healthy (site, trading, finance, collector)
- [ ] MCP endpoint on UAT accepts authenticated calls
- [ ] Production MCP endpoint is responding
- [ ] Latest CLI is available in test environment (or will be after tag)

**Status**: ___________

## 9. Final Pre-Tag Checklist

Before running `git tag vX.Y.Z`:

- [ ] All items 1-8 above are ✓
- [ ] No uncommitted changes: `git status --short` is empty
- [ ] Latest commit message follows conventional format
- [ ] Release notes are drafted (use RELEASE_PR_TEMPLATE.md)
- [ ] Slack/team notified that release is imminent
- [ ] Support/ops team available for monitoring post-release

**Status**: ___________

## 10. Release Execution

```bash
# Verify no uncommitted changes
git status --short

# Tag the release
git tag -a vX.Y.Z -m "Release vX.Y.Z — Claude Code Marketplace Ready"

# Push tag (triggers publish workflow)
git push origin vX.Y.Z

# Monitor CI
# → Check https://github.com/VecTrade-io/vectrade-mcp/actions
# → Confirm publish workflow runs and completes
# → Verify npm, PyPI, and GitHub release artifacts
```

**Execution complete**: ___________

## 11. Post-Release Verification

After tag is pushed and workflows complete:

- [ ] GitHub release created with correct version
- [ ] npm package published: `npm info @vectrade/mcp-server | grep latest`
- [ ] PyPI package published: check https://pypi.org/project/vectrade-mcp/
- [ ] Changelog links correct version (not yet)
- [ ] Production MCP smoke workflow can be run manually

**Status**: ___________

## 12. Marketplace Submission Ready

- [ ] CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md sections 1-3 completed
- [ ] Release artifacts are public and stable
- [ ] MCP endpoint is responding to authorized requests
- [ ] Support docs (PRIVACY, SUPPORT_SLA) are accessible
- [ ] 7-day production smoke greenness window started

**Status**: ___________

---

## Summary

**Total Checks**: 12  
**Passed**: _____ / 12  

**Verdict**: 
- [ ] **GO** — All checks passed, safe to release
- [ ] **NO-GO** — See issues below, do not release
- [ ] **CONDITIONAL GO** — Minor items outstanding, documented below

**Issues/Notes**:
```
[Add any issues found, workarounds, or blocking items here]
```

**Release Coordinator**: ________________  
**Date Checked**: ________________  
**Approval**: ________________
