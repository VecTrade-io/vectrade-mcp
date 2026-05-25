/**
 * Fundamentals tools (5 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";
import {
  formatFundamentals,
  formatFinancialStatement,
  formatGeneric,
} from "../utils/formatters.js";

export function registerFundamentalTools(server: McpServer): void {
  server.tool(
    "get_fundamentals",
    "Get company fundamental data including P/E, EPS, margins, and valuation metrics",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol)}`
      );
      return { content: [{ type: "text", text: formatFundamentals(data) }] };
    }
  );

  server.tool(
    "get_income_statement",
    "Get income statement — revenue, COGS, operating income, net income, EPS",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      period: z
        .enum(["annual", "quarterly"])
        .default("annual")
        .describe("Reporting period"),
    },
    async ({ symbol, period }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol)}/income`,
        { period }
      );
      return {
        content: [{ type: "text", text: formatFinancialStatement(data, "Income Statement") }],
      };
    }
  );

  server.tool(
    "get_balance_sheet",
    "Get balance sheet — assets, liabilities, shareholders equity",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      period: z
        .enum(["annual", "quarterly"])
        .default("annual")
        .describe("Reporting period"),
    },
    async ({ symbol, period }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol)}/balance-sheet`,
        { period }
      );
      return {
        content: [{ type: "text", text: formatFinancialStatement(data, "Balance Sheet") }],
      };
    }
  );

  server.tool(
    "get_cash_flow",
    "Get cash flow statement — operating, investing, financing activities",
    {
      symbol: z.string().describe("Stock ticker symbol"),
      period: z
        .enum(["annual", "quarterly"])
        .default("annual")
        .describe("Reporting period"),
    },
    async ({ symbol, period }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol)}/cash-flow`,
        { period }
      );
      return {
        content: [{ type: "text", text: formatFinancialStatement(data, "Cash Flow Statement") }],
      };
    }
  );

  server.tool(
    "get_company_profile",
    "Get company profile — description, sector, industry, employees, CEO, website",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/fundamentals/${encodeURIComponent(symbol)}/profile`
      );
      return {
        content: [{ type: "text", text: formatGeneric(data, `${symbol} Company Profile`) }],
      };
    }
  );
}
