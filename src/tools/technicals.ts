/**
 * Technical Analysis tools (1 tool).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatGeneric } from "../utils/formatters.js";

export function registerTechnicalTools(server: McpServer): void {
  server.tool(
    "get_technicals",
    "Get technical indicators (RSI, MACD, SMA, EMA, Bollinger Bands, support/resistance) for a stock",
    {
      symbol: z.string().describe("Stock ticker symbol"),
    },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/technical/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return { content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Technical Analysis`) }] };
    }
  );
}
