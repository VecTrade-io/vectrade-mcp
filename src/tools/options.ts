/**
 * Options tools (2 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatOptionsChain, formatGeneric } from "../utils/formatters.js";

export function registerOptionsTools(server: McpServer): void {
  server.tool(
    "get_options_chain",
    "Get the options chain (calls and puts) for a symbol with a specific expiration date",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      expiration: z
        .string()
        .optional()
        .describe("Expiration date (YYYY-MM-DD). Defaults to nearest expiry."),
    },
    async ({ symbol, expiration }) => {
      const params: Record<string, string> = {};
      if (expiration) params.expiration = expiration;
      const data = await getClient().get<Record<string, unknown>>(
        `/options/${encodeURIComponent(symbol)}/chain`,
        params
      );
      return { content: [{ type: "text", text: formatOptionsChain(data) }] };
    }
  );

  server.tool(
    "get_unusual_options",
    "Find unusual options activity — large volume, high IV, or institutional flow",
    {
      symbol: z
        .string()
        .optional()
        .describe("Filter by specific symbol (optional — shows all if omitted)"),
    },
    async ({ symbol }) => {
      const params: Record<string, string> = {};
      if (symbol) params.symbol = symbol;
      const data = await getClient().get<Record<string, unknown>[]>(
        "/options/unusual",
        params
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, "Unusual Options Activity") }],
      };
    }
  );
}
