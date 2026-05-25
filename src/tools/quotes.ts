/**
 * Quotes & Market Data tools (5 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatQuote, formatGeneric } from "../utils/formatters.js";

export function registerQuoteTools(server: McpServer): void {
  server.tool(
    "get_quote",
    "Get real-time stock quote with price, volume, change, and key metrics",
    { symbol: z.string().describe("Stock ticker symbol (e.g., AAPL)") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/quotes/${encodeURIComponent(symbol)}`
      );
      return { content: [{ type: "text", text: formatQuote(data) }] };
    }
  );

  server.tool(
    "get_batch_quotes",
    "Get real-time quotes for multiple symbols in one call (max 50)",
    {
      symbols: z
        .array(z.string())
        .max(50)
        .describe("Array of ticker symbols"),
    },
    async ({ symbols }) => {
      const data = await getClient().get<Record<string, unknown>[]>(
        "/quotes/batch",
        { symbols: symbols.join(",") }
      );
      const text = data.map((q) => formatQuote(q)).join("\n\n---\n\n");
      return { content: [{ type: "text", text }] };
    }
  );

  server.tool(
    "get_historical_prices",
    "Get historical OHLCV price data for charting and analysis",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      interval: z
        .enum(["1m", "5m", "15m", "1h", "1d", "1w", "1M"])
        .default("1d")
        .describe("Candle interval"),
      period: z
        .enum(["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y", "max"])
        .default("3mo")
        .describe("Lookback period"),
    },
    async ({ symbol, interval, period }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/quotes/${encodeURIComponent(symbol)}/history`,
        { interval, period }
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol} Historical Prices`) }],
      };
    }
  );

  server.tool(
    "get_market_movers",
    "Get top market movers — gainers, losers, or most active stocks",
    {
      type: z
        .enum(["gainers", "losers", "active"])
        .describe("Type of movers to retrieve"),
    },
    async ({ type }) => {
      const data = await getClient().get<Record<string, unknown>[]>(
        `/market/movers/${type}`
      );
      const lines = data.map(
        (s) => `- **${s.symbol}** ${s.name}: $${s.price} (${s.changePercent}%)`
      );
      return {
        content: [{ type: "text", text: `## Market ${type}\n\n${lines.join("\n")}` }],
      };
    }
  );

  server.tool(
    "get_market_status",
    "Check if the stock market is currently open or closed",
    {},
    async () => {
      const data = await getClient().get<Record<string, unknown>>("/market/status");
      return {
        content: [
          {
            type: "text",
            text: `Market is **${data.isOpen ? "OPEN" : "CLOSED"}**. ${data.message || ""}`.trim(),
          },
        ],
      };
    }
  );
}
