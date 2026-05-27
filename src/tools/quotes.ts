/**
 * Quotes & Market Data tools (3 tools).
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
        `/quotes/${encodeURIComponent(symbol.toUpperCase())}`
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
        { symbols: symbols.map((s) => s.toUpperCase()).join(",") }
      );
      const items = Array.isArray(data) ? data : [data];
      const text = items.map((q) => formatQuote(q)).join("\n\n---\n\n");
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
        `/quotes/${encodeURIComponent(symbol.toUpperCase())}/history`,
        { interval, period }
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Historical Prices`) }],
      };
    }
  );
}
