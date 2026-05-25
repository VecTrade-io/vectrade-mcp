/**
 * News & Sentiment tools (3 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatNews, formatGeneric } from "../utils/formatters.js";

export function registerNewsTools(server: McpServer): void {
  server.tool(
    "get_news",
    "Get latest financial news articles, optionally filtered by symbols or category",
    {
      symbols: z
        .array(z.string())
        .optional()
        .describe("Filter by ticker symbols"),
      category: z
        .enum(["general", "earnings", "mergers", "ipo", "crypto", "forex"])
        .optional()
        .describe("News category filter"),
      limit: z.number().min(1).max(50).default(10).describe("Number of articles"),
    },
    async ({ symbols, category, limit }) => {
      const params: Record<string, string> = { limit: String(limit) };
      if (symbols?.length) params.symbols = symbols.join(",");
      if (category) params.category = category;
      const data = await getClient().get<Record<string, unknown>[]>("/news", params);
      return { content: [{ type: "text", text: formatNews(data) }] };
    }
  );

  server.tool(
    "get_sentiment",
    "Get aggregated sentiment score for a stock based on news and social media",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/news/sentiment/${encodeURIComponent(symbol)}`
      );
      const score = data.score as number;
      const label = score > 0.3 ? "Bullish" : score < -0.3 ? "Bearish" : "Neutral";
      return {
        content: [
          {
            type: "text",
            text: `## ${symbol} Sentiment: **${label}** (${score.toFixed(2)})\n\nBased on ${data.articleCount} articles and ${data.socialMentions} social mentions.`,
          },
        ],
      };
    }
  );

  server.tool(
    "get_analyst_ratings",
    "Get analyst consensus rating, price targets, and recent upgrades/downgrades",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/news/analyst/${encodeURIComponent(symbol)}`
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol} Analyst Ratings`) }],
      };
    }
  );
}
