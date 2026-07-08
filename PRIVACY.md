# Privacy Policy

This document describes how VecTrade MCP handles data and credentials.

## What we process

- MCP request metadata required to serve API calls
- Tool arguments provided by the MCP client
- Authentication headers required for API authorization

## What we do not do

- We do not intentionally log raw API keys.
- We do not sell user data.
- We do not use MCP payloads for advertising.

## Credential handling

- API keys should be provided through environment variables or MCP client secure config.
- Keys must be rotated immediately if accidental exposure is suspected.
- Support requests should include only masked keys.

## Data retention

- Operational logs are retained only as needed for reliability, security, and support.
- Retention windows may vary by deployment environment and legal requirements.

## User responsibilities

- Do not send secrets unrelated to VecTrade in tool arguments.
- Validate generated trading actions before execution.

## Contact

For privacy questions, contact: `privacy@vectrade.io`
