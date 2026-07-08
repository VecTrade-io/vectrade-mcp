---
name: Marketplace rollout checklist
about: Track Claude Code marketplace readiness and launch tasks
title: "[Marketplace] Claude Code rollout checklist"
labels: ["marketplace", "claude-code", "tracking"]
assignees: []
---

## P0 Onboarding and reliability

- [ ] Add docs section for `vectrade setup claude-code`
- [ ] Document `vectrade doctor` and expected outputs
- [ ] Verify clean install from npm and PyPI paths
- [ ] Validate error messaging for invalid `tvt_` vs `vq_` key use
- [ ] Confirm minimum supported Node/Python versions in docs

## P1 Production confidence

- [ ] Configure `VECTRADE_PROD_MCP_API_KEY` GitHub secret for smoke workflow
- [ ] Run production smoke workflow manually and capture baseline timings
- [ ] Tune smoke failure messages for auth/plan/quota issues
- [ ] Define alert routing for repeated smoke failures

## P2 Marketplace packaging

- [ ] Finalize marketplace listing copy and screenshots
- [ ] Publish troubleshooting FAQ for common setup failures
- [ ] Add migration notes for existing local MCP configurations
- [ ] Confirm support ownership and SLA for marketplace users

## Exit criteria

- [ ] `setup` and `doctor` pass on macOS, Windows, and Linux
- [ ] Production smoke passes for 7 consecutive days
- [ ] Reviewer sign-off from product + engineering
