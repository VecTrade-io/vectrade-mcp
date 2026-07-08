#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT = process.cwd();
const REQUIRED_TOOLS = [
  "get_quote",
  "get_news",
  "get_technicals",
  "get_portfolio",
  "get_trading_kpi",
];

const TOOL_MATRIX = [
  { name: "get_quote", arguments: { symbol: "AAPL" }, requiresBotKey: false },
  { name: "get_news", arguments: { symbol: "AAPL" }, requiresBotKey: false },
  { name: "get_technicals", arguments: { symbol: "AAPL" }, requiresBotKey: false },
  { name: "get_portfolio", arguments: {}, requiresBotKey: true },
  { name: "get_trading_kpi", arguments: {}, requiresBotKey: true },
];

function parseArgs(argv) {
  const args = { transport: "both", url: "https://mcp.vectrade.io/mcp", out: "" };
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--transport") {
      args.transport = argv[i + 1] || args.transport;
      i += 1;
    } else if (token === "--url") {
      args.url = argv[i + 1] || args.url;
      i += 1;
    } else if (token === "--out") {
      args.out = argv[i + 1] || "";
      i += 1;
    }
  }
  return args;
}

function nowIso() {
  return new Date().toISOString();
}

function trimText(value, n = 220) {
  if (!value) return "";
  return value.length > n ? `${value.slice(0, n)}...` : value;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function preflightChecks() {
  const checks = [];

  const claudeConfigPath = path.join(ROOT, "configs", "claude-desktop.json");
  const skillPath = path.join(ROOT, "skill.json");

  try {
    const raw = await fs.readFile(claudeConfigPath, "utf8");
    const json = JSON.parse(raw);
    const vt = json?.mcpServers?.vectrade;
    const ok =
      Boolean(vt) &&
      vt.command === "npx" &&
      Array.isArray(vt.args) &&
      vt.args.includes("@vectrade/mcp-server");

    checks.push({
      name: "claude_desktop_config_shape",
      ok,
      detail: ok
        ? "configs/claude-desktop.json has valid vectrade MCP server command args"
        : "configs/claude-desktop.json is missing or malformed for Claude Desktop",
    });
  } catch (error) {
    checks.push({
      name: "claude_desktop_config_shape",
      ok: false,
      detail: `Failed to parse configs/claude-desktop.json: ${String(error)}`,
    });
  }

  try {
    const raw = await fs.readFile(skillPath, "utf8");
    const json = JSON.parse(raw);
    const mcp = json?.mcp || {};
    const mcpReady =
      mcp.transport === "stdio" &&
      mcp.command === "npx" &&
      Array.isArray(mcp.args) &&
      mcp.args.includes("@vectrade/mcp-server");

    checks.push({
      name: "skill_manifest_mcp_runnable",
      ok: Boolean(mcpReady),
      detail: mcpReady
        ? "skill.json contains a runnable stdio MCP stanza"
        : "skill.json does not contain a runnable stdio MCP stanza",
    });

    checks.push({
      name: "skill_manifest_claude_native_plugin",
      ok: false,
      detail:
        "skill.json is not a guaranteed Claude-native plugin manifest format; treat as metadata and provide Claude MCP config as the deployment source of truth",
    });
  } catch (error) {
    checks.push({
      name: "skill_manifest_checks",
      ok: false,
      detail: `Failed to parse skill.json: ${String(error)}`,
    });
  }

  return checks;
}

async function connectHosted(url, apiKey) {
  const client = new Client({ name: "vectrade-claude-compat", version: "1.0.0" }, { capabilities: {} });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: {
        "X-API-Key": apiKey,
      },
    },
  });

  await client.connect(transport);
  return {
    client,
    close: async () => {
      await client.close();
    },
  };
}

async function ensureLocalBuild() {
  const distEntry = path.join(ROOT, "dist", "index.js");
  return fileExists(distEntry);
}

async function connectStdio(env) {
  const client = new Client({ name: "vectrade-claude-compat", version: "1.0.0" }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"],
    cwd: ROOT,
    env,
    stderr: "inherit",
  });

  await client.connect(transport);
  return {
    client,
    close: async () => {
      await client.close();
    },
  };
}

async function runMatrix(client, context) {
  const checks = [];

  try {
    const tools = await client.listTools();
    const toolNames = new Set((tools.tools || []).map((t) => t.name));

    const missing = REQUIRED_TOOLS.filter((name) => !toolNames.has(name));
    checks.push({
      name: `${context}_tool_discovery`,
      ok: missing.length === 0,
      detail:
        missing.length === 0
          ? `All required tools discovered (${REQUIRED_TOOLS.length})`
          : `Missing tools: ${missing.join(", ")}`,
    });
  } catch (error) {
    checks.push({
      name: `${context}_tool_discovery`,
      ok: false,
      detail: `listTools failed: ${String(error)}`,
    });
    return checks;
  }

  for (const tc of TOOL_MATRIX) {
    if (tc.requiresBotKey && !process.env.VECTRADE_BOT_KEY) {
      checks.push({
        name: `${context}_tool_${tc.name}`,
        ok: false,
        detail: "VECTRADE_BOT_KEY not set; cannot validate portfolio/trading endpoints",
      });
      continue;
    }

    try {
      const startedAt = Date.now();
      const result = await client.callTool({ name: tc.name, arguments: tc.arguments });
      const ms = Date.now() - startedAt;
      const firstText =
        (result.content || []).find((c) => c.type === "text")?.text ||
        (result.isError ? "Tool returned isError=true" : "No text content");

      checks.push({
        name: `${context}_tool_${tc.name}`,
        ok: !result.isError,
        detail: `latency_ms=${ms}; sample=${trimText(firstText)}`,
      });
    } catch (error) {
      checks.push({
        name: `${context}_tool_${tc.name}`,
        ok: false,
        detail: String(error),
      });
    }
  }

  return checks;
}

function summarize(report) {
  const checks = report.checks || [];
  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.length - passed;
  return { passed, failed, total: checks.length };
}

async function main() {
  const args = parseArgs(process.argv);
  const report = {
    started_at: nowIso(),
    args,
    env: {
      has_api_key: Boolean(process.env.VECTRADE_API_KEY),
      has_bot_key: Boolean(process.env.VECTRADE_BOT_KEY),
    },
    checks: [],
  };

  report.checks.push(...(await preflightChecks()));

  if (!process.env.VECTRADE_API_KEY) {
    report.checks.push({
      name: "credential_api_key",
      ok: false,
      detail: "VECTRADE_API_KEY is required for hosted and market-data tool tests",
    });
  }

  if (args.transport === "hosted" || args.transport === "both") {
    if (!process.env.VECTRADE_API_KEY) {
      report.checks.push({
        name: "hosted_connect",
        ok: false,
        detail: "Skipped hosted tests because VECTRADE_API_KEY is not set",
      });
    } else {
      let hosted;
      try {
        hosted = await connectHosted(args.url, process.env.VECTRADE_API_KEY);
        report.checks.push({
          name: "hosted_connect",
          ok: true,
          detail: `Connected to ${args.url}`,
        });
        report.checks.push(...(await runMatrix(hosted.client, "hosted")));
      } catch (error) {
        report.checks.push({
          name: "hosted_connect",
          ok: false,
          detail: String(error),
        });
      } finally {
        if (hosted) await hosted.close();
      }
    }
  }

  if (args.transport === "stdio" || args.transport === "both") {
    const hasDist = await ensureLocalBuild();
    if (!hasDist) {
      report.checks.push({
        name: "stdio_build_artifact",
        ok: false,
        detail: "dist/index.js is missing; run npm run build before stdio test",
      });
    } else {
      let stdio;
      try {
        const env = {
          ...process.env,
          VECTRADE_API_KEY: process.env.VECTRADE_API_KEY || "",
          VECTRADE_BOT_KEY: process.env.VECTRADE_BOT_KEY || "",
        };
        stdio = await connectStdio(env);
        report.checks.push({
          name: "stdio_connect",
          ok: true,
          detail: "Connected to local stdio server (node dist/index.js)",
        });
        report.checks.push(...(await runMatrix(stdio.client, "stdio")));
      } catch (error) {
        report.checks.push({
          name: "stdio_connect",
          ok: false,
          detail: String(error),
        });
      } finally {
        if (stdio) await stdio.close();
      }
    }
  }

  report.finished_at = nowIso();
  report.summary = summarize(report);

  if (args.out) {
    const outPath = path.resolve(ROOT, args.out);
    await fs.writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(`Wrote report: ${outPath}`);
  }

  console.log(JSON.stringify(report, null, 2));

  const exitCode = report.summary.failed > 0 ? 1 : 0;
  process.exit(exitCode);
}

main().catch((error) => {
  console.error("Fatal error running claude compatibility checks:", error);
  process.exit(2);
});
