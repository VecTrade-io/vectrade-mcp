# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a Vulnerability

**Do not open a public issue.**

Email **security@vectrade.io** with:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment

We will acknowledge receipt within **48 hours** and provide a fix timeline within **5 business days**.

## Best Practices

- Never commit API keys or secrets.
- Config files written by the setup wizard are restricted to owner-only permissions (`600`) on Unix systems.
- Use environment variables (`VECTRADE_API_KEY`) instead of hardcoding keys.
