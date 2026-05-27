/**
 * Options tools (1 tool).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatGeneric } from "../utils/formatters.js";

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
        `/options/${encodeURIComponent(symbol.toUpperCase())}/chain`,
        params
      );
      return { content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Options Chain`) }] };
    }
  );
}
