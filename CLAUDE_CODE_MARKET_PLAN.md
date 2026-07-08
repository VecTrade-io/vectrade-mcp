# Claude Code Marketplace Plan

## Goal

Ship VecTrade as an installable, trusted integration for Claude Code users, with a fallback path that still gives one-command setup if formal marketplace listing is unavailable or delayed.

## Current Readiness

The repo already has key assets needed for distribution:

- NPM package with CLI entrypoint in [package.json](package.json)
- Hosted MCP endpoint documented in [README.md](README.md)
- IDE config templates in [configs/](configs)
- Compatibility check script via `npm run test:claude-compat`

Main remaining work is packaging, trust, operations, and listing workflow.

## Product Modes

Support two install modes from day one:

1. Hosted MCP mode (recommended)
- User config points to `https://mcp.vectrade.io/mcp`
- Auth via `X-API-Key: vq_...`
- Zero local runtime requirements beyond Claude Code MCP support

2. Local connector mode
- User installs `@vectrade/mcp-server`
- Connector writes Claude config automatically
- Useful when users prefer local control or custom endpoints

## Marketplace Path

Use this sequence to reduce launch risk:

1. Pre-submission hardening
2. Private/beta distribution
3. Marketplace submission
4. Public rollout

### 1) Pre-submission Hardening

Functional requirements:

- MCP initialize, tools/list, tools/call pass against production and UAT
- Clear error messages for:
  - Invalid key
  - No paid plan for MCP
  - Quota exceeded
- One-command setup path for Claude Code

Security and trust requirements:

- Key handling policy documented (no logging of raw keys)
- Key rotation and revoke flow documented
- Incident runbook for MCP outage and auth regressions
- Dependency scan and lockfile hygiene in CI

Operational requirements:

- SLO and alerts for `mcp.vectrade.io` uptime and latency
- Versioned release notes for breaking MCP behavior changes
- Backward compatibility policy for tool schemas

### 2) Beta Distribution

Before official listing, validate adoption with a closed beta:

- Publish signed releases and npm package updates
- Provide a beta install guide for Claude Code users
- Collect telemetry:
  - initialize success rate
  - tools/list success rate
  - top failing tools
  - auth/plan errors by code

Exit criteria:

- 7-day successful initialize rate >= 99%
- No critical auth or key leakage issues
- Mean setup time <= 3 minutes based on beta feedback

### 3) Marketplace Submission

Prepare a submission bundle:

- Listing metadata:
  - Name, short description, long description
  - Categories and keywords
  - Support and privacy links
- Verification artifacts:
  - Hosted endpoint ownership
  - Organization identity
  - Security contact and incident policy
- Demo assets:
  - 60-90 second setup clip
  - 3 reproducible example prompts
- Technical manifest:
  - Required headers (`X-API-Key`)
  - Required plan entitlement
  - Tool catalog summary

If Claude Code marketplace has additional requirements (publisher verification, policy checks, or client-side packaging format), map each requirement to a tracked checklist item before submission.

### 4) Public Rollout

Rollout in stages:

1. `10%` traffic gate for new users
2. `50%` after 24 hours with no Sev-1
3. `100%` after 72 hours with no regression trend

Post-launch monitors:

- Initialize success rate
- Auth failure rate (`401`, `403`)
- Tool error rate by method
- P95 latency for initialize and tool calls

## Implementation Backlog

P0 (required for listing):

- Add Claude Code setup command to CLI (`vectrade mcp setup claude-code`)
- Add production MCP smoke test workflow (initialize, tools/list, tools/call)
- Add runbook section for MCP key, plan, and quota troubleshooting
- Add policy docs: privacy, security, support SLA

P1 (strongly recommended):

- Add onboarding validator command (`vectrade mcp doctor`)
- Add schema contract tests for top 10 tools
- Add progressive retry guidance for transient upstream failures

P2 (scale and growth):

- Per-tool entitlement flags
- Scoped API keys for MCP-only access
- Marketplace analytics attribution tags

## Suggested Timeline

Week 1:

- P0 implementation and docs
- UAT and production smoke pipelines

Week 2:

- Beta rollout to selected users
- Fix top setup friction points

Week 3:

- Submission package finalization
- Marketplace submission

Week 4:

- Staged public rollout
- Post-launch review and hardening

## Risks and Mitigations

Risk: Marketplace review delays or policy mismatch
- Mitigation: maintain first-class direct install path in parallel

Risk: Users attempt MCP with bot key (`tvt_`) instead of VQ key (`vq_`)
- Mitigation: explicit preflight check in setup and doctor commands

Risk: Paid-plan gating creates onboarding confusion
- Mitigation: show plan status and upgrade link in setup output before writing config

Risk: Tool schema drift breaks prompts
- Mitigation: schema compatibility tests and versioned changelog

## Definition of Done

This initiative is complete when:

1. Claude Code users can install and connect in <= 3 minutes
2. Initialize and tools/list succeed for >= 99% of valid users
3. Listing is published (or documented as pending) with fallback direct install path promoted
4. Support and incident runbooks are in place and tested
