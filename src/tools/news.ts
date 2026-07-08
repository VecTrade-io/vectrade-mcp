/**
 * News, Sentiment & Analyst tools (3 tools).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../utils/api-client.js";

export function registerNewsTools(server: McpServer): void {
  server.tool(
    "get_news",
    "Get latest financial news articles for a stock symbol",
    {
      symbol: z.string().describe("Stock ticker symbol"),
    },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/news/${encodeURIComponent(symbol.toUpperCase())}`
      );
      // Response: { ticker, articles: [...], count }
      const articles = (data.articles || data) as Record<string, unknown>[];
      if (!Array.isArray(articles) || !articles.length) {
        return { content: [{ type: "text", text: `No recent news found for ${symbol.toUpperCase()}.` }] };
      }
      const lines = articles.slice(0, 10).map((a) =>
        `### ${a.headline || a.title}\n${a.summary || ""}\n*Source: ${a.source || "N/A"} | ${a.publishedDate || a.date || ""}*`
      );
      return { content: [{ type: "text", text: `## ${symbol.toUpperCase()} News\n\n${lines.join("\n\n")}` }] };
    }
  );

  server.tool(
    "get_sentiment",
    "Get aggregated sentiment score for a stock based on news and social media",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/sentiment/${encodeURIComponent(symbol.toUpperCase())}`
      );
      // Response: { sentiment_score, signal, sentiment_trend, news_sentiment_breakdown, social_sentiment }
      const score = (data.sentiment_score as number) ?? 50;
      const signal = (data.signal as string) || "NEUTRAL";
      const trend = (data.sentiment_trend as string) || "unknown";
      const social = data.social_sentiment as Record<string, unknown> | undefined;
      let text = `## ${symbol.toUpperCase()} Sentiment\n\n`;
      text += `**Signal:** ${signal} | **Score:** ${score}/100 | **Trend:** ${trend}\n`;
      if (social) {
        text += `\n**Social:** Twitter ${social.twitter_sentiment}, Reddit ${social.reddit_sentiment}, StockTwits ${social.stocktwits_sentiment} | Mentions (24h): ${social.mentions_24h}`;
      }
      return { content: [{ type: "text", text }] };
    }
  );

  server.tool(
    "get_analyst_ratings",
    "Get analyst consensus rating, price targets, and recommendation breakdown",
    { symbol: z.string().describe("Stock ticker symbol") },
    async ({ symbol }) => {
      const data = await getClient().get<Record<string, unknown>>(
        `/analyst/${encodeURIComponent(symbol.toUpperCase())}`
      );
      // Response: { ticker, ratings: {strong_buy, buy, hold, sell, strong_sell, total_analysts}, consensus, price_target }
      const ratings = data.ratings as Record<string, number> | undefined;
      const consensus = data.consensus as Record<string, unknown> | undefined;
      const target = data.price_target as Record<string, unknown> | undefined;
      let text = `## ${symbol.toUpperCase()} Analyst Ratings\n\n`;
      if (consensus) {
        text += `**Consensus:** ${consensus.rating} (Score: ${consensus.weighted_score})\n\n`;
      }
      if (ratings) {
        text += `| Rating | Count |\n|--------|-------|\n`;
        text += `| Strong Buy | ${ratings.strong_buy} |\n| Buy | ${ratings.buy} |\n| Hold | ${ratings.hold} |\n| Sell | ${ratings.sell} |\n| Strong Sell | ${ratings.strong_sell} |\n`;
        text += `\n**Total Analysts:** ${ratings.total_analysts}\n`;
      }
      if (target) {
        text += `\n**Price Target:** Mean $${target.target_mean} | High $${target.target_high} | Low $${target.target_low}`;
      }
      return { content: [{ type: "text", text }] };
    }
  );
}
