/**
 * Integration tests for the hosted MCP server at mcp.vectrade.io.
 *
 * Tests run against the LIVE production server. The first group requires
 * no API key (health, CORS, initialize, tools/list). The second group
 * requires VECTRADE_API_KEY to call real data tools.
 */

import { describe, it, expect } from "vitest";

const BASE = "https://mcp.vectrade.io";
const API_KEY = process.env.VECTRADE_API_KEY || "";

async function mcpRequest(
  path: string,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {}
) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  // Parse SSE "data:" lines
  const dataLine = text
    .split("\n")
    .find((l) => l.startsWith("data:"));
  const parsed = dataLine ? JSON.parse(dataLine.slice(5)) : JSON.parse(text);
  return { res, body: parsed, sessionId: res.headers.get("mcp-session-id") };
}

describe("mcp.vectrade.io hosted server", () => {
  it("health endpoint returns ok", async () => {
    const res = await fetch(`${BASE}/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("CORS headers are present", async () => {
    const res = await fetch(`${BASE}/health`, {
      headers: { Origin: "https://example.com" },
    });
    expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
  });

  it("initialize handshake succeeds", async () => {
    const { body } = await mcpRequest("/mcp", {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "test", version: "1.0.0" },
      },
    });
    expect(body.result.serverInfo.name).toBe("vectrade");
    expect(body.result.protocolVersion).toBe("2025-03-26");
  });

  it("tools/list returns 14 tools", async () => {
    const initRes = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    const sessionId = initRes.headers.get("mcp-session-id")!;

    const { body } = await mcpRequest(
      "/mcp",
      { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
      { "mcp-session-id": sessionId }
    );
    const tools = (body as any).result.tools;
    expect(tools.length).toBe(14);
    const names = tools.map((t: any) => t.name);
    expect(names).toContain("get_quote");
    expect(names).toContain("get_technicals");
    expect(names).toContain("get_options_chain");
    expect(names).toContain("get_analyst_ratings");
  });

  it("tool call without API key returns clear error", async () => {
    const initRes = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    const sessionId = initRes.headers.get("mcp-session-id")!;

    const { body } = await mcpRequest(
      "/mcp",
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "get_quote", arguments: { symbol: "AAPL" } },
      },
      { "mcp-session-id": sessionId }
    );
    expect((body as any).result.isError).toBe(true);
    expect((body as any).result.content[0].text).toContain("API key required");
  });

  it("tool call with invalid API key returns auth error", async () => {
    const initRes = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "X-API-Key": "vq_invalid_key_12345",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      }),
    });
    const sessionId = initRes.headers.get("mcp-session-id")!;

    const { body } = await mcpRequest(
      "/mcp",
      {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "get_quote", arguments: { symbol: "AAPL" } },
      },
      { "mcp-session-id": sessionId, "X-API-Key": "vq_invalid_key_12345" }
    );
    expect((body as any).result.isError).toBe(true);
    expect((body as any).result.content[0].text).toContain("error");
  });

  describe("with valid API key", () => {
    it.skipIf(!API_KEY)("get_quote returns real AAPL data", async () => {
      const initRes = await fetch(`${BASE}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });
      const sessionId = initRes.headers.get("mcp-session-id")!;

      const { body } = await mcpRequest(
        "/mcp",
        {
          jsonrpc: "2.0",
          id: 5,
          method: "tools/call",
          params: { name: "get_quote", arguments: { symbol: "AAPL" } },
        },
        { "mcp-session-id": sessionId, "X-API-Key": API_KEY }
      );

      expect((body as any).result.isError).toBeFalsy();
      const text = (body as any).result.content[0].text;
      expect(text).toContain("AAPL");
    });

    it.skipIf(!API_KEY)("get_technicals returns real data", async () => {
      const initRes = await fetch(`${BASE}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });
      const sessionId = initRes.headers.get("mcp-session-id")!;

      const { body } = await mcpRequest(
        "/mcp",
        {
          jsonrpc: "2.0",
          id: 6,
          method: "tools/call",
          params: { name: "get_technicals", arguments: { symbol: "AAPL" } },
        },
        { "mcp-session-id": sessionId, "X-API-Key": API_KEY }
      );

      expect((body as any).result.isError).toBeFalsy();
      const text = (body as any).result.content[0].text;
      expect(text).toMatch(/technical|RSI|MACD|score/i);
    });

    it.skipIf(!API_KEY)("get_analyst_ratings returns data", async () => {
      const initRes = await fetch(`${BASE}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test", version: "1.0.0" },
          },
        }),
      });
      const sessionId = initRes.headers.get("mcp-session-id")!;

      const { body } = await mcpRequest(
        "/mcp",
        {
          jsonrpc: "2.0",
          id: 7,
          method: "tools/call",
          params: { name: "get_analyst_ratings", arguments: { symbol: "AAPL" } },
        },
        { "mcp-session-id": sessionId, "X-API-Key": API_KEY }
      );

      expect((body as any).result.isError).toBeFalsy();
      const text = (body as any).result.content[0].text;
      expect(text).toMatch(/Buy|Hold|Sell|Analyst/i);
    });
  });

  describe("SSE transport", () => {
    it("SSE endpoint accepts connection and returns event stream", async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const res = await fetch(`${BASE}/sse`, {
          headers: { Accept: "text/event-stream" },
          signal: controller.signal,
        });
        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toContain("text/event-stream");
        // Read first chunk
        const reader = res.body!.getReader();
        const { value } = await reader.read();
        const text = new TextDecoder().decode(value);
        expect(text).toContain("event:");
        reader.cancel();
      } catch (e: any) {
        if (e.name !== "AbortError") throw e;
      } finally {
        clearTimeout(timeout);
      }
    });
  });
});
