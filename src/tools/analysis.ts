/**
 * AI Analysis tools (3 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";

export function registerAnalysisTools(server: McpServer): void {
  server.tool(
    "analyze_stock",
    "Get AI-powered comprehensive stock analysis including fundamentals, technicals, and outlook",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      context: z
        .string()
        .optional()
        .describe("Additional context for the analysis (e.g., 'pre-earnings', 'long-term hold')"),
    },
    async ({ symbol, context }) => {
      const data = await getClient().post<{ analysis: string }>(
        "/ai/analyze",
        { symbol, context }
      );
      return { content: [{ type: "text", text: data.analysis }] };
    }
  );

  server.tool(
    "compare_stocks",
    "AI-powered side-by-side comparison of multiple stocks across key metrics",
    {
      symbols: z
        .array(z.string())
        .min(2)
        .max(5)
        .describe("Ticker symbols to compare (2-5)"),
    },
    async ({ symbols }) => {
      const data = await getClient().post<{ comparison: string }>(
        "/ai/compare",
        { symbols }
      );
      return { content: [{ type: "text", text: data.comparison }] };
    }
  );

  server.tool(
    "explain_movement",
    "AI explanation of why a stock moved significantly in a given period",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      period: z
        .enum(["today", "1d", "1w", "1mo"])
        .default("today")
        .describe("Period to explain"),
    },
    async ({ symbol, period }) => {
      const data = await getClient().post<{ explanation: string }>(
        "/ai/explain",
        { symbol, period }
      );
      return { content: [{ type: "text", text: data.explanation }] };
    }
  );
}
