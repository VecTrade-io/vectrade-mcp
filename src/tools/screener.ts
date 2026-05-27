/**
 * Insider & Upgrades tools (2 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatGeneric } from "../utils/formatters.js";

export function registerScreenerTools(server: McpServer): void {
  server.tool(
    "get_insider_trading",
    "Get recent insider trading activity — buys, sells, and exercises by company insiders",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/insider/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return { content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Insider Trading`) }] };
    }
  );

  server.tool(
    "get_upgrades_downgrades",
    "Get recent analyst upgrades and downgrades for a stock",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/upgrades-downgrades/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return { content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Upgrades/Downgrades`) }] };
    }
  );
}
