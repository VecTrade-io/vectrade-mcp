# VecTrade Industrial-Grade Hardening Checklist

Last updated: 2026-07-08

This checklist is the execution plan to move from production-ready MCP service to industrial-grade trading service operations.

## Program Targets

- Availability SLO: 99.95% monthly for `mcp.vectrade.io`
- API error budget: <= 0.05%
- P95 latency target: <= 1200ms for `initialize`, <= 2000ms for `tools/call`
- Recovery targets: RTO <= 60 minutes, RPO <= 15 minutes

## P0 (Complete in 30 days)

| Workstream | Owner | Due date | Exit criteria |
|---|---|---:|---|
| Trading risk guardrails (position/notional caps, drawdown stop, kill switch) | Trading Platform Lead | 2026-08-07 | All execution endpoints enforce hard limits server-side; emergency kill switch tested in staging and prod |
| Fine-grained authorization (tool-level + tenant-level policy) | Security Lead | 2026-08-07 | Policy engine in place; unauthorized tool access returns deterministic 403 with audit event |
| Immutable audit trail for trade actions | Data Platform Lead | 2026-08-07 | Append-only trade audit log with actor, intent, payload hash, and decision outcome |
| Key security baseline (rotation + leak detection) | Security Engineering | 2026-08-07 | 90-day key rotation policy enforced; secret scanning blocks merges with leaked credentials |
| Incident playbooks and on-call handoff | SRE Lead | 2026-08-07 | Runbooks for auth outage, MCP degradation, and bad-order incident; tabletop drill completed |

## P1 (Complete in 60 days)

| Workstream | Owner | Due date | Exit criteria |
|---|---|---:|---|
| Multi-region failover for MCP control plane | Infrastructure Lead | 2026-09-06 | Active-passive failover tested monthly with no manual SSH steps |
| Canary deploy + automatic rollback | Release Engineering | 2026-09-06 | 10/50/100 rollout gates with rollback on SLO breach |
| Compliance retention and forensics workflow | Compliance Lead | 2026-09-06 | Evidence retention policy documented and validated in incident simulation |
| Contract testing for MCP tool schemas | Developer Experience Lead | 2026-09-06 | Contract tests for top 20 tools run in CI and pre-release |

## P2 (Complete in 90 days)

| Workstream | Owner | Due date | Exit criteria |
|---|---|---:|---|
| Disaster recovery game days | SRE + Platform | 2026-10-06 | Quarterly DR drill with documented gaps and follow-up actions |
| Tenant isolation stress testing | Security + Platform | 2026-10-06 | Proved no cross-tenant data leakage under load and failure modes |
| Regulatory mapping pack (jurisdiction-specific) | Compliance + Legal | 2026-10-06 | Controls mapped to target regulatory framework and signed off |

## Weekly Governance Cadence

- Monday: risk and incident review (30 minutes)
- Wednesday: SLO and error-budget review (30 minutes)
- Friday: release readiness and rollback validation (30 minutes)

## Evidence to Attach Per Milestone

- CI run links for smoke and contract tests
- Incident drill notes and action log
- Rollback proof from staging and production canary
- Security scan reports and key-rotation evidence

## Definition of Industrial-Grade Done

- All P0, P1, and P2 exit criteria are met and signed off by owners.
- Two consecutive 30-day periods meet SLO/error-budget targets.
- At least one full incident simulation and one DR drill are passed without critical findings.
