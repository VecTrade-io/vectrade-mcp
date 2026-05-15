# VecTrade MCP Tools Reference

27 financial tools available through the Model Context Protocol.

## Quotes & Market Data

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_quote` | Real-time stock quote | `symbol` (required) |
| `get_batch_quotes` | Multiple quotes in one call | `symbols` (array, max 50) |
| `get_historical_prices` | Historical OHLCV data | `symbol`, `interval`, `period` |
| `get_market_movers` | Top gainers/losers/active | `type` (gainers\|losers\|active) |
| `get_market_status` | Market open/close status | — |

## Fundamentals

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_fundamentals` | Company financial data | `symbol` |
| `get_income_statement` | Revenue, earnings, margins | `symbol`, `period` |
| `get_balance_sheet` | Assets, liabilities, equity | `symbol`, `period` |
| `get_cash_flow` | Operating/investing/financing | `symbol`, `period` |
| `get_company_profile` | Company info and description | `symbol` |

## Technical Analysis

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_technicals` | Technical indicators (RSI, MACD, etc.) | `symbol`, `indicators`, `interval` |
| `get_support_resistance` | Key price levels | `symbol` |
| `get_chart_patterns` | Detected chart patterns | `symbol`, `interval` |

## News & Sentiment

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_news` | Latest financial news | `symbols`, `category`, `limit` |
| `get_sentiment` | Aggregated sentiment score | `symbol` |
| `get_analyst_ratings` | Analyst consensus & targets | `symbol` |

## Screening & Discovery

| Tool | Description | Parameters |
|------|-------------|------------|
| `run_screener` | Stock screening with filters | `filters` (object) |
| `get_sector_performance` | Sector returns & rotation | `period` |
| `get_similar_stocks` | Find similar companies | `symbol`, `limit` |

## AI Analysis

| Tool | Description | Parameters |
|------|-------------|------------|
| `analyze_stock` | AI-powered stock analysis | `symbol`, `context` |
| `compare_stocks` | Side-by-side AI comparison | `symbols` (array) |
| `explain_movement` | Explain price movement | `symbol`, `period` |

## Portfolio & Watchlist

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_watchlist` | User's watchlist | — |
| `add_to_watchlist` | Add symbol to watchlist | `symbol` |
| `get_portfolio_summary` | Portfolio performance | — |

## Options

| Tool | Description | Parameters |
|------|-------------|------------|
| `get_options_chain` | Options chain for symbol | `symbol`, `expiration` |
| `get_unusual_options` | Unusual options activity | `symbol` (optional) |

---

## Authentication

All tools require a valid `VECTRADE_API_KEY`. The MCP server handles authentication automatically when configured.

## Rate Limits

MCP tool calls count against your API rate limit. Default: 100 requests/minute (Free), 1000/minute (Pro).
