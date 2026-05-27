/**
 * Fundamentals tools (4 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import { formatGeneric } from "../utils/formatters.js";

export function registerFundamentalTools(server: McpServer): void {
  server.tool(
    "get_fundamentals",
    "Get company fundamental data including P/E, EPS, market cap, margins, and valuation metrics",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return { content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Fundamentals`) }] };
    }
  );

  server.tool(
    "get_financial_statements",
    "Get income statement, balance sheet, and cash flow statement for a company",
    {
      symbol: z.string().describe("Stock ticker symbol"),
    },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol.toUpperCase())}/statements`
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Financial Statements`) }],
      };
    }
  );

  server.tool(
    "get_company_profile",
    "Get company profile — description, sector, industry, employees, CEO, website",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/profile/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Company Profile`) }],
      };
    }
  );

  server.tool(
    "get_earnings",
    "Get earnings history, consensus estimates, and upcoming earnings data",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/earnings/${encodeURIComponent(symbol.toUpperCase())}`
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol.toUpperCase()} Earnings`) }],
      };
    }
  );
}
