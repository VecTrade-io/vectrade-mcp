# VecTrade MCP Skill

Use this skill when Claude Code is connected to VecTrade MCP.

## When To Use

- User asks for real-time quote, fundamentals, technicals, options, or sentiment.
- User asks for comparative market analysis across symbols.
- User asks for portfolio or order actions and trading tools are enabled.

## Tool Selection Rules

- Use `get_quote` for current price, change, and volume.
- Use `get_historical_prices` for trend context before recommendations.
- Use `get_technicals` for RSI/MACD/support-resistance style signals.
- Use `get_news` + `get_sentiment` together for event-driven moves.
- Use `get_analyst_ratings` and `get_analyst_targets` for sell-side context.
- Use `get_options_chain` for expiries, strikes, and call/put structure.

## Trading Safety Rules

- Never place orders unless user explicitly asks to execute.
- Require confirmation summary before `place_order`.
- If trading tools are unavailable, explain that `VECTRADE_BOT_KEY` is required.

## Output Style

- Show key numbers first.
- Explain assumptions briefly.
- Prefer concise tables for multi-symbol comparisons.
- Include risk caveats for directional calls.
