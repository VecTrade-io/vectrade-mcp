# MCP Operations Runbook

This runbook covers the most common MCP onboarding failures and how to resolve them quickly.

## Scope

- Hosted MCP endpoint: `https://mcp.vectrade.io/mcp`
- Required auth header: `X-API-Key: vq_...`
- Typical methods: `initialize`, `tools/list`, `tools/call`

## Fast Triage

Run local diagnostics first:

```bash
export VECTRADE_API_KEY=vq_live_...
vectrade mcp doctor
```

If doctor passes, failures are likely client-config or prompt-specific.

## Troubleshooting Matrix

| Symptom | Likely cause | How to verify | Fix |
|---|---|---|---|
| `401 Unauthorized` | Invalid/missing key | Run `vectrade mcp doctor` | Set valid `vq_...` key in MCP config |
| `403 Forbidden` on MCP | Plan entitlement missing | Check account plan in developer portal | Upgrade to paid MCP-enabled plan |
| `tvt_` key rejected | Bot key used for MCP | Doctor prints key-type failure | Use VQ key (`vq_...`) for MCP; keep bot key for trading tools |
| `429` or quota errors | Rate/usage limit exceeded | Inspect response body for quota code | Wait/retry or increase plan quota |
| `tools/list` returns empty | Downstream auth/entitlement issue | Doctor fails after initialize | Recheck key + plan + endpoint |
| Timeout/network errors | Client/proxy/network issue | `curl` direct call to MCP endpoint | Retry with stable network; verify corporate proxy rules |

## Manual Smoke Commands

Initialize:

```bash
curl -sS -X POST https://mcp.vectrade.io/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${VECTRADE_API_KEY}" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","clientInfo":{"name":"runbook-smoke","version":"1.0.0"},"capabilities":{}}}'
```

Tools list:

```bash
curl -sS -X POST https://mcp.vectrade.io/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${VECTRADE_API_KEY}" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

Example tool call:

```bash
curl -sS -X POST https://mcp.vectrade.io/mcp \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${VECTRADE_API_KEY}" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_assets","arguments":{"q":"apple","limit":3}}}'
```

## Security and Key Handling

- Never log or paste full API keys in tickets.
- Mask keys in all support output.
- Rotate keys immediately if exposed.
- Prefer env vars over hardcoded keys in config files.

## Escalation Template

When opening an internal incident or support ticket, include:

1. Timestamp (UTC) of failure
2. Client used (Claude Code, Cursor, etc.)
3. Failing method (`initialize`, `tools/list`, or `tools/call`)
4. HTTP status code and error payload (sanitized)
5. Doctor output (sanitized)
