/**
 * Portfolio & Watchlist tools (3 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatGeneric } from "../utils/formatters.js";

export function registerPortfolioTools(server: McpServer): void {
  server.tool(
    "get_watchlist",
    "Get the user's watchlist with current prices and daily changes",
    {},
    async () => {
      const data = await getClient().get<Record<string, unknown>[]>("/watchlist");
      if (!data.length) {
        return { content: [{ type: "text", text: "Your watchlist is empty." }] };
      }
      const lines = data.map(
        (s) => `- **${s.symbol}** ${s.name}: $${s.price} (${s.changePercent}%)`
      );
      return {
        content: [{ type: "text", text: `## Your Watchlist\n\n${lines.join("\n")}` }],
      };
    }
  );

  server.tool(
    "add_to_watchlist",
    "Add a stock symbol to the user's watchlist",
    { symbol: z.string().describe("Stock ticker symbol to add") },
    async ({ symbol }) => {
      await getClient().post("/watchlist", { symbol });
      return {
        content: [{ type: "text", text: `Added **${symbol.toUpperCase()}** to your watchlist.` }],
      };
    }
  );

  server.tool(
    "get_portfolio_summary",
    "Get portfolio performance summary including total value, daily P&L, and allocation",
    {},
    async () => {
      const data = await getClient().get<Record<string, unknown>>("/portfolio/summary");
      return {
        content: [{ type: "text", text: formatGeneric(data, "Portfolio Summary") }],
      };
    }
  );
}
