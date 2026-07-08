# Quick Release Process (5-Step)

**Pre-flight**: All validation checks passed ✅

---

## Step 1: Bump Version (2 min)

```bash
cd /Users/everestkwok/Projects/vectrade/vectrade-mcp

# Edit package.json: change "version" to "X.Y.Z"
vi package.json

# Edit pyproject.toml: change version = to "X.Y.Z"
vi pyproject.toml

# Verify versions match
grep '"version"' package.json
grep 'version = ' pyproject.toml
```

---

## Step 2: Update CHANGELOG (5 min)

```bash
# Open CHANGELOG.md
vi CHANGELOG.md

# Replace "## [Unreleased]" with:
# ## [X.Y.Z] — 2026-07-08
#
# ### Added
# - Unified CLI: `vectrade mcp setup <ide>` and `vectrade mcp doctor`
# - Production MCP smoke workflow (hourly + manual trigger)
# - Marketplace operational docs: runbook, privacy, SLA, submission guide
# - npm publish step in release pipeline
# - TypeScript strict mode compliance fixes
# - Trading portfolio formatter fixes
#
# ### Fixed
# - [list other fixes from release notes]
#
# [X.Y.Z]: https://github.com/VecTrade-io/vectrade-mcp/releases/tag/vX.Y.Z
```

---

## Step 3: Commit & Tag (2 min)

```bash
# Verify everything is ready
git status

# Stage changes
git add package.json pyproject.toml CHANGELOG.md

# Commit with conventional message
git commit -m "chore(release): vX.Y.Z — Claude Code Marketplace Ready"

# Create signed/annotated tag (recommended)
git tag -a vX.Y.Z -m "Release vX.Y.Z — Claude Code Marketplace Ready

This release includes:
- Unified MCP CLI (setup + doctor)
- Production smoke workflow
- Marketplace operational docs
- Strict TypeScript compliance

See RELEASE_PR_TEMPLATE.md for full details."

# Verify tag was created
git tag -l vX.Y.Z -n5

# Push tag (triggers publish workflow)
git push origin vX.Y.Z
```

---

## Step 4: Monitor CI (5-10 min)

```bash
# Watch GitHub Actions progress:
# https://github.com/VecTrade-io/vectrade-mcp/actions/workflows/publish.yml

# Workflow steps:
# 1. Checkout code
# 2. Setup Node + npm auth
# 3. npm ci + npm run build
# 4. npm publish --access public
# 5. Setup Python
# 6. python -m build
# 7. Publish to PyPI
# 8. Create GitHub Release

# If any step fails:
# - Check error message
# - Verify secret is set (NPM_TOKEN, PyPI token via trusted publishing)
# - Rerun workflow or manually publish from CLI
```

---

## Step 5: Verify Release (2-5 min)

```bash
# Check GitHub Release Created
open https://github.com/VecTrade-io/vectrade-mcp/releases/tag/vX.Y.Z

# Verify npm Package
npm info @vectrade/mcp-server
npm info @vectrade/mcp-server@X.Y.Z

# Verify PyPI Package
pip index versions vectrade-mcp
# or visit: https://pypi.org/project/vectrade-mcp/X.Y.Z/

# Verify CLI Available
npm install -g @vectrade/mcp-server@X.Y.Z
vectrade mcp doctor --help
```

---

## Post-Release (Next Steps)

### Immediate
- [ ] Slack/team notification: "vX.Y.Z released"
- [ ] Support team alerted for monitoring

### 24 Hours
- [ ] Production MCP smoke is running hourly → check dashboard
- [ ] Collect feedback from early users

### 7 Days
- [ ] Confirm 7 consecutive days of green smoke checks
- [ ] No Sev-1 auth/key incidents
- [ ] Proceed with marketplace submission

### Marketplace Submission
Follow [CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md](CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md):
1. Prepare listing metadata
2. Create demo video
3. Write troubleshooting guide
4. Submit to Claude Code marketplace
5. Monitor post-launch for 72h

---

## Troubleshooting

### npm publish fails
- Verify `NPM_TOKEN` secret is set in GitHub
- Check token is valid and has `vectrade` org write access
- Token should be regenerated if >90 days old

### PyPI publish fails
- If trusted publishing: check GitHub OIDC is enabled
- If using token: verify PyPI token is valid
- Check package metadata (version must not exist)

### MCP smoke workflow fails
- Check production MCP endpoint is responsive
- Verify `VECTRADE_PROD_MCP_API_KEY` is set and starts with `vq_`
- Run manual smoke: `curl -X POST https://mcp.vectrade.io/mcp ...` (see MCP_RUNBOOK.md)

### Tag push doesn't trigger workflow
- Verify tag name format: `vX.Y.Z` (must start with 'v')
- Check `.github/workflows/publish.yml` has correct trigger (`push.tags: ["v*"]`)
- Force re-run from Actions tab if needed

---

## Questions?

- Setup/doctor CLI issues: see [vectrade_mcp/cli.py](vectrade_mcp/cli.py)
- MCP protocol issues: see [MCP_RUNBOOK.md](MCP_RUNBOOK.md)
- Marketplace submission: see [CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md](CLAUDE_CODE_MARKET_SUBMISSION_GUIDE.md)
- Pre-release checklist: see [PRE_RELEASE_CHECKLIST.md](PRE_RELEASE_CHECKLIST.md)

---

**Release Time Estimate**: 15-20 minutes total  
**CI Time**: 3-5 minutes (publish workflow)  
**Package Availability**: 5-15 minutes after CI completes
