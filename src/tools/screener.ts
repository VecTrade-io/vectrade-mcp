/**
 * Screening & Discovery tools (3 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatScreenerResults, formatGeneric } from "../utils/formatters.js";

export function registerScreenerTools(server: McpServer): void {
  server.tool(
    "run_screener",
    "Screen stocks by financial criteria (market cap, P/E, dividend yield, sector, etc.)",
    {
      filters: z
        .object({
          marketCapMin: z.number().optional().describe("Minimum market cap in USD"),
          marketCapMax: z.number().optional().describe("Maximum market cap in USD"),
          peMin: z.number().optional().describe("Minimum P/E ratio"),
          peMax: z.number().optional().describe("Maximum P/E ratio"),
          dividendYieldMin: z.number().optional().describe("Minimum dividend yield %"),
          sector: z.string().optional().describe("Sector filter (e.g., Technology)"),
          industry: z.string().optional().describe("Industry filter"),
          exchange: z.string().optional().describe("Exchange (NYSE, NASDAQ)"),
        })
        .describe("Screening filter criteria"),
    },
    async ({ filters }) => {
      const data = await getClient().post<Record<string, unknown>[]>(
        "/screener",
        filters
      );
      return { content: [{ type: "text", text: formatScreenerResults(data) }] };
    }
  );

  server.tool(
    "get_sector_performance",
    "Get sector performance and rotation data showing which sectors are leading/lagging",
    {
      period: z
        .enum(["1d", "1w", "1mo", "3mo", "6mo", "1y", "ytd"])
        .default("1mo")
        .describe("Performance period"),
    },
    async ({ period }) => {
      const data = await getClient().get<Record<string, unknown>[]>(
        "/market/sectors",
        { period }
      );
      const lines = data.map(
        (s) => `- **${s.sector}**: ${s.performance}%`
      );
      return {
        content: [
          { type: "text", text: `## Sector Performance (${period})\n\n${lines.join("\n")}` },
        ],
      };
    }
  );

  server.tool(
    "get_similar_stocks",
    "Find companies similar to a given stock based on sector, size, and fundamentals",
    {
      symbol: z.string().describe("Stock ticker to find similar companies for"),
      limit: z.number().min(1).max(20).default(5).describe("Number of results"),
    },
    async ({ symbol, limit }) => {
      const data = await getClient().get<Record<string, unknown>[]>(
        `/screener/similar/${encodeURIComponent(symbol)}`,
        { limit: String(limit) }
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `Stocks similar to ${symbol}`) }],
      };
    }
  );
}
