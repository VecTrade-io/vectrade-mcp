/**
 * VecTrade MCP Server — Server creation and tool registration.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerQuoteTools } from "./tools/quotes.js";
import { registerFundamentalTools } from "./tools/fundamentals.js";
import { registerTechnicalTools } from "./tools/technicals.js";
import { registerNewsTools } from "./tools/news.js";
import { registerScreenerTools } from "./tools/screener.js";
import { registerOptionsTools } from "./tools/options.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "vectrade",
    version: "1.0.0",
    description:
      "Real-time financial data, technical analysis, options, news & sentiment for AI coding assistants",
  });

  // Register all tool groups
  registerQuoteTools(server);       // get_quote, get_batch_quotes, get_historical_prices
  registerFundamentalTools(server); // get_fundamentals, get_financial_statements, get_company_profile, get_earnings
  registerTechnicalTools(server);   // get_technicals
  registerNewsTools(server);        // get_news, get_sentiment, get_analyst_ratings
  registerScreenerTools(server);    // get_insider_trading, get_upgrades_downgrades
  registerOptionsTools(server);     // get_options_chain

  return server;
}
