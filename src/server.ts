/**
 * VecTrade MCP Server — Server creation and tool registration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQuoteTools } from "./tools/quotes.js";
import { registerFundamentalTools } from "./tools/fundamentals.js";
import { registerTechnicalTools } from "./tools/technicals.js";
import { registerNewsTools } from "./tools/news.js";
import { registerScreenerTools } from "./tools/screener.js";
import { registerAnalysisTools } from "./tools/analysis.js";
import { registerPortfolioTools } from "./tools/portfolio.js";
import { registerOptionsTools } from "./tools/options.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "vectrade",
    version: "1.0.0",
    description:
      "Real-time financial data, AI stock analysis, screening & options for AI coding assistants",
  });

  // Register all tool groups
  registerQuoteTools(server);
  registerFundamentalTools(server);
  registerTechnicalTools(server);
  registerNewsTools(server);
  registerScreenerTools(server);
  registerAnalysisTools(server);
  registerPortfolioTools(server);
  registerOptionsTools(server);

  return server;
}
