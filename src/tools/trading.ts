/**
 * Bot Trading tools — trade execution via the VecTrade Bot API.
 *
 * These tools allow AI agents to place/cancel orders, read portfolio,
 * and check trading KPIs on their VecTrade account.
 *
 * Authentication: Uses VECTRADE_BOT_KEY env var (tvt_... format)
 * API base: https://vectrade.io (not api.vectrade.io — goes through site proxy)
 *
 * These tools are SEPARATE from market data tools. Market data uses X-API-Key
 * against the professional data API. Trading uses X-Bot-Key against the Bot API.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const BOT_API_BASE =
  process.env.VECTRADE_BOT_API_BASE || "https://vectrade.io/api/trade/v1/bot";
const BOT_TIMEOUT = 15_000;

function resolveBotKey(): string {
  const key = process.env.VECTRADE_BOT_KEY || "";
  if (!key) {
    throw new Error(
      "VECTRADE_BOT_KEY is required for trading tools. " +
        "Create one at https://vectrade.io/vtrade/developer (Bot API Keys section)."
    );
  }
  if (!key.startsWith("tvt_")) {
    throw new Error("VECTRADE_BOT_KEY must start with 'tvt_'");
  }
  return key;
}

async function botRequest<T = unknown>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BOT_API_BASE}${path}`;

  const headers: Record<string, string> = {
    "X-Bot-Key": resolveBotKey(),
    "User-Agent": "vectrade-mcp-server/1.0.0",
    Accept: "application/json",
  };
  if (body) headers["Content-Type"] = "application/json";

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(BOT_TIMEOUT),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as Record<string, string>;
    const msg = err.detail || err.message || response.statusText;
    throw new Error(`Bot API error (${response.status}): ${msg}`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

// ─── Response formatting ─────────────────────────────────────────

function formatOrder(o: Record<string, unknown>): string {
  const lines = [
    `Order ${o.id}`,
    `  Symbol: ${o.symbol}`,
    `  Side: ${o.side}  Type: ${o.order_type}`,
    `  Quantity: ${o.quantity}`,
    `  Status: ${o.status}`,
  ];
  if (o.limit_price) lines.push(`  Limit Price: $${o.limit_price}`);
  if (o.stop_price) lines.push(`  Stop Price: $${o.stop_price}`);
  if (o.filled_price) lines.push(`  Filled @ $${o.filled_price} (qty: ${o.filled_quantity})`);
  if (o.rejection_reason) lines.push(`  Rejected: ${o.rejection_reason}`);
  lines.push(`  Created: ${o.created_at}`);
  return lines.join("\n");
}

function formatPortfolio(p: Record<string, unknown>): string {
  const positions = (p.positions as Record<string, unknown>[]) || [];
  const lines = [
    `Portfolio Summary`,
    `  Cash Balance: $${p.balance}`,
    `  Total Equity: $${p.total_equity}`,
    `  Positions: ${positions.length}`,
    "",
  ];
  for (const pos of positions) {
    lines.push(
      `  ${pos.symbol} (${pos.asset_type}): ${pos.quantity} @ $${pos.avg_cost} avg`
    );
    if (pos.market_value) lines.push(`    Market Value: $${pos.market_value}`);
    if (pos.unrealized_pnl) lines.push(`    Unrealized P&L: $${pos.unrealized_pnl}`);
  }
  return lines.join("\n");
}

function formatKPI(k: Record<string, unknown>): string {
  return [
    `Trading KPIs`,
    `  Return: ${(k.total_return_pct as number) >= 0 ? "+" : ""}${k.total_return_pct}%`,
    `  Sharpe Ratio: ${k.sharpe_ratio}`,
    `  Win Rate: ${k.win_rate}%`,
    `  Profit Factor: ${k.profit_factor}`,
    `  Max Drawdown: ${k.max_drawdown}%`,
    `  Total Trades: ${k.total_trades}`,
    `  Sortino: ${k.sortino_ratio}`,
    `  Expectancy: ${k.expectancy}`,
    `  Consecutive Wins: ${k.consecutive_wins}`,
    `  Consecutive Losses: ${k.consecutive_losses}`,
    k.rank ? `  Leaderboard Rank: #${k.rank} / ${k.rank_total}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Tool registration ───────────────────────────────────────────

export function registerTradingTools(server: McpServer): void {
  // ── Place Order ────────────────────────────────────────────────
  server.tool(
    "place_order",
    "Place a trade order (buy/sell) on your VecTrade account. Supports market, limit, stop, and stop-limit orders.",
    {
      symbol: z.string().describe("Ticker symbol (e.g., AAPL, BTC-USD, EUR-USD)"),
      side: z.enum(["BUY", "SELL"]).describe("Order side"),
      quantity: z.number().positive().describe("Number of shares/units to trade"),
      asset_type: z
        .enum(["STOCK", "CRYPTO", "FOREX", "ETF", "OPTION", "COMMODITY"])
        .default("STOCK")
        .describe("Asset class"),
      order_type: z
        .enum(["MARKET", "LIMIT", "STOP", "STOP_LIMIT"])
        .default("MARKET")
        .describe("Order type"),
      limit_price: z.number().positive().optional().describe("Limit price (required for LIMIT/STOP_LIMIT)"),
      stop_price: z.number().positive().optional().describe("Stop trigger price (required for STOP/STOP_LIMIT)"),
      time_in_force: z
        .enum(["GTC", "DAY", "IOC", "FOK"])
        .default("GTC")
        .describe("Time in force"),
      client_order_id: z.string().optional().describe("Your idempotency key (prevents duplicate orders)"),
    },
    async (params) => {
      const order = await botRequest<Record<string, unknown>>("POST", "/orders", {
        symbol: params.symbol.toUpperCase(),
        asset_type: params.asset_type,
        side: params.side,
        order_type: params.order_type,
        quantity: params.quantity,
        limit_price: params.limit_price,
        stop_price: params.stop_price,
        time_in_force: params.time_in_force,
        client_order_id: params.client_order_id,
      });
      return { content: [{ type: "text", text: formatOrder(order) }] };
    }
  );

  // ── Cancel Order ───────────────────────────────────────────────
  server.tool(
    "cancel_order",
    "Cancel an open order by its ID",
    {
      order_id: z.string().describe("UUID of the order to cancel"),
    },
    async ({ order_id }) => {
      await botRequest("DELETE", `/orders/${order_id}`);
      return { content: [{ type: "text", text: `Order ${order_id} cancelled successfully.` }] };
    }
  );

  // ── List Orders ────────────────────────────────────────────────
  server.tool(
    "get_orders",
    "List your recent orders, optionally filtered by status (OPEN, FILLED, CANCELLED, REJECTED)",
    {
      status: z
        .enum(["OPEN", "FILLED", "CANCELLED", "REJECTED"])
        .optional()
        .describe("Filter by order status"),
      limit: z.number().min(1).max(100).default(20).describe("Number of orders to return"),
    },
    async ({ status, limit }) => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("limit", String(limit));
      const qs = params.toString();
      const orders = await botRequest<Record<string, unknown>[]>("GET", `/orders?${qs}`);
      if (!orders.length) {
        return { content: [{ type: "text", text: "No orders found." }] };
      }
      const text = orders.map(formatOrder).join("\n\n---\n\n");
      return { content: [{ type: "text", text }] };
    }
  );

  // ── Get Portfolio ──────────────────────────────────────────────
  server.tool(
    "get_portfolio",
    "Get your current portfolio — cash balance, positions, and unrealized P&L",
    {},
    async () => {
      const portfolio = await botRequest<Record<string, unknown>>("GET", "/portfolio");
      return { content: [{ type: "text", text: formatPortfolio(portfolio) }] };
    }
  );

  // ── Get KPIs ───────────────────────────────────────────────────
  server.tool(
    "get_trading_kpi",
    "Get your trading performance KPIs — return, Sharpe, win rate, drawdown, rank",
    {},
    async () => {
      const kpi = await botRequest<Record<string, unknown>>("GET", "/kpi");
      return { content: [{ type: "text", text: formatKPI(kpi) }] };
    }
  );

  // ── Get Account ────────────────────────────────────────────────
  server.tool(
    "get_bot_account",
    "Get your bot account info — balance, status, API usage quota",
    {},
    async () => {
      const account = await botRequest<Record<string, unknown>>("GET", "/account");
      const lines = [
        `Bot Account`,
        `  Display Name: ${account.display_name}`,
        `  Balance: $${account.balance}`,
        `  Status: ${account.status}`,
        `  User Type: ${account.user_type}`,
      ];
      if (account.plan) lines.push(`  Plan: ${account.plan}`);
      if (account.bot_keys_used != null) {
        lines.push(`  Bot Keys: ${account.bot_keys_used} / ${account.bot_keys_limit}`);
      }
      if (account.api_calls_used != null) {
        lines.push(`  API Usage: ${account.api_calls_used} / ${account.api_calls_limit}`);
      }
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );
}
