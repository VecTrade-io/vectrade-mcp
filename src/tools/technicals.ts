/**
 * Technical Analysis tools (3 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatTechnicals, formatGeneric } from "../utils/formatters.js";

export function registerTechnicalTools(server: McpServer): void {
  server.tool(
    "get_technicals",
    "Get technical indicators (RSI, MACD, SMA, EMA, Bollinger Bands, etc.) for a stock",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      indicators: z
        .array(z.string())
        .optional()
        .describe("Specific indicators to retrieve (e.g., ['RSI', 'MACD'])"),
      interval: z
        .enum(["1h", "4h", "1d", "1w"])
        .default("1d")
        .describe("Timeframe for indicator calculation"),
    },
    async ({ symbol, indicators, interval }) => {
      const params: Record<string, string> = { interval };
      if (indicators?.length) params.indicators = indicators.join(",");
      const data = await getClient().get<Record<string, unknown>>(
        `/technicals/${encodeURIComponent(symbol)}`,
        params
      );
      return { content: [{ type: "text", text: formatTechnicals(data) }] };
    }
  );

  server.tool(
    "get_support_resistance",
    "Get key support and resistance price levels for a stock",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/technicals/${encodeURIComponent(symbol)}/levels`
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol} Support & Resistance`) }],
      };
    }
  );

  server.tool(
    "get_chart_patterns",
    "Detect chart patterns (head & shoulders, double top/bottom, triangles, etc.)",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      interval: z
        .enum(["1h", "4h", "1d", "1w"])
        .default("1d")
        .describe("Timeframe for pattern detection"),
    },
    async ({ symbol, interval }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/technicals/${encodeURIComponent(symbol)}/patterns`,
        { interval }
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol} Chart Patterns`) }],
      };
    }
  );
}
