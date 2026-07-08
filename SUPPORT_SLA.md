# Support and SLA

This policy defines support channels and response objectives for VecTrade MCP.

## Support channels

- GitHub issues: `https://github.com/VecTrade-io/vectrade-mcp/issues`
- Community support: `https://discord.gg/vectrade`
- Security incidents: `security@vectrade.io`

## Severity levels

| Severity | Description | Target first response |
|---|---|---|
| Sev-1 | Widespread outage or complete MCP failure | 1 hour |
| Sev-2 | Major feature degradation, no viable workaround | 4 hours |
| Sev-3 | Partial degradation with workaround | 1 business day |
| Sev-4 | Minor issue, docs or non-critical bug | 3 business days |

## Availability objective

- Hosted MCP target availability: 99.9% monthly
- Scope: hosted endpoint availability only, excluding third-party network incidents

## Incident updates

- Sev-1 and Sev-2 incidents receive periodic status updates until mitigation.
- Post-incident summary is published for major incidents.

## What to include in a support report

1. Timestamp and timezone
2. MCP method called
3. HTTP status and sanitized error payload
4. Client and version
5. Reproduction steps
