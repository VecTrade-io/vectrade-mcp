/**
 * Response formatters — structure API data for AI readability.
 */

export function formatQuote(quote: Record<string, unknown>): string {
  const lines = [
    `## ${quote.symbol} — ${quote.name || "N/A"}`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Price | $${quote.price} |`,
    `| Change | ${quote.change} (${quote.changePercent}%) |`,
    `| Volume | ${formatNumber(quote.volume as number)} |`,
    `| Day High | $${quote.dayHigh} |`,
    `| Day Low | $${quote.dayLow} |`,
    `| 52W High | $${quote.fiftyTwoWeekHigh} |`,
    `| 52W Low | $${quote.fiftyTwoWeekLow} |`,
    `| Market Cap | ${formatLargeNumber(quote.marketCap as number)} |`,
  ];
  return lines.join("\n");
}

export function formatFundamentals(data: Record<string, unknown>): string {
  const lines = [
    `## ${data.symbol} — Fundamentals`,
    "",
    `| Metric | Value |`,
    `|--------|-------|`,
    `| P/E Ratio | ${data.peRatio ?? "N/A"} |`,
    `| EPS | $${data.eps ?? "N/A"} |`,
    `| Dividend Yield | ${data.dividendYield ?? "N/A"}% |`,
    `| Market Cap | ${formatLargeNumber(data.marketCap as number)} |`,
    `| Revenue (TTM) | ${formatLargeNumber(data.revenue as number)} |`,
    `| Net Income (TTM) | ${formatLargeNumber(data.netIncome as number)} |`,
    `| Profit Margin | ${data.profitMargin ?? "N/A"}% |`,
    `| ROE | ${data.roe ?? "N/A"}% |`,
    `| Debt/Equity | ${data.debtToEquity ?? "N/A"} |`,
  ];
  return lines.join("\n");
}

export function formatFinancialStatement(
  data: Record<string, unknown>,
  title: string
): string {
  const entries = Object.entries(data).filter(
    ([key]) => !["symbol", "period", "fiscalDate"].includes(key)
  );
  const lines = [
    `## ${data.symbol} — ${title} (${data.period || "annual"})`,
    "",
    `| Line Item | Value |`,
    `|-----------|-------|`,
    ...entries.map(([key, val]) => `| ${camelToTitle(key)} | ${formatValue(val)} |`),
  ];
  return lines.join("\n");
}

export function formatTechnicals(data: Record<string, unknown>): string {
  const lines = [
    `## ${data.symbol} — Technical Indicators`,
    "",
    `| Indicator | Value | Signal |`,
    `|-----------|-------|--------|`,
  ];
  const indicators = data.indicators as Record<string, { value: number; signal: string }>[] | undefined;
  if (Array.isArray(indicators)) {
    for (const ind of indicators) {
      const entry = ind as unknown as Record<string, unknown>;
      lines.push(`| ${entry.name} | ${entry.value} | ${entry.signal} |`);
    }
  }
  return lines.join("\n");
}

export function formatNews(articles: Record<string, unknown>[]): string {
  if (!articles.length) return "No news articles found.";
  const lines = articles.map(
    (a, i) =>
      `${i + 1}. **${a.title}** (${a.source}, ${a.publishedAt})\n   ${a.summary || ""}`
  );
  return lines.join("\n\n");
}

export function formatScreenerResults(results: Record<string, unknown>[]): string {
  if (!results.length) return "No stocks matched your screening criteria.";
  const lines = [
    `| Symbol | Name | Price | Change% | Market Cap |`,
    `|--------|------|-------|---------|------------|`,
    ...results.map(
      (r) =>
        `| ${r.symbol} | ${r.name} | $${r.price} | ${r.changePercent}% | ${formatLargeNumber(r.marketCap as number)} |`
    ),
  ];
  return lines.join("\n");
}

export function formatOptionsChain(data: Record<string, unknown>): string {
  const lines = [
    `## ${data.symbol} Options Chain — Exp: ${data.expiration}`,
    "",
  ];

  const calls = data.calls as Record<string, unknown>[] | undefined;
  if (calls?.length) {
    lines.push("### Calls", "", "| Strike | Bid | Ask | Volume | OI | IV |", "|--------|-----|-----|--------|----|----|");
    for (const c of calls.slice(0, 15)) {
      lines.push(`| $${c.strike} | $${c.bid} | $${c.ask} | ${c.volume} | ${c.openInterest} | ${c.impliedVolatility}% |`);
    }
  }

  const puts = data.puts as Record<string, unknown>[] | undefined;
  if (puts?.length) {
    lines.push("", "### Puts", "", "| Strike | Bid | Ask | Volume | OI | IV |", "|--------|-----|-----|--------|----|----|");
    for (const p of puts.slice(0, 15)) {
      lines.push(`| $${p.strike} | $${p.bid} | $${p.ask} | ${p.volume} | ${p.openInterest} | ${p.impliedVolatility}% |`);
    }
  }

  return lines.join("\n");
}

export function formatGeneric(data: unknown, title?: string): string {
  if (title) {
    return `## ${title}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
  }
  return JSON.stringify(data, null, 2);
}

// --- Helpers ---

function formatNumber(n: number | undefined): string {
  if (n == null) return "N/A";
  return n.toLocaleString("en-US");
}

function formatLargeNumber(n: number | undefined): string {
  if (n == null) return "N/A";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${formatNumber(n)}`;
}

function formatValue(val: unknown): string {
  if (val == null) return "N/A";
  if (typeof val === "number") return formatLargeNumber(val);
  return String(val);
}

function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
