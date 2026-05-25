/**
 * VecTrade MCP Server — Entry point.
 *
 * Supports three transports:
 * - stdio (default): For local IDE integration via npx
 * - sse: Legacy SSE transport for remote hosting
 * - http: Streamable HTTP transport (recommended for mcp.vectrade.io)
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const mode = process.argv.includes("--http")
    ? "http"
    : process.argv.includes("--sse")
      ? "sse"
      : "stdio";

  if (mode === "stdio") {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);

    process.on("SIGINT", async () => {
      await server.close();
      process.exit(0);
    });
  } else if (mode === "http") {
    await startStreamableHTTPServer();
  } else {
    await startSSEServer();
  }
}

/**
 * Streamable HTTP transport — supports multiple concurrent sessions.
 * Each POST to /mcp creates or resumes a session.
 */
async function startStreamableHTTPServer(): Promise<void> {
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );
  const { SSEServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/sse.js"
  );
  const { createServer: createHTTPServer } = await import("node:http");
  const port = parseInt(process.env.PORT || "3200", 10);

  const sessions = new Map<string, { server: ReturnType<typeof createServer>; transport: InstanceType<typeof StreamableHTTPServerTransport> }>();
  const sseSessions = new Map<string, { server: ReturnType<typeof createServer>; transport: InstanceType<typeof SSEServerTransport> }>();

  const httpServer = createHTTPServer(async (req, res) => {
    // CORS for browser-based clients
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, mcp-session-id, X-API-Key");
    res.setHeader("Access-Control-Expose-Headers", "mcp-session-id");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        server: "vectrade-mcp",
        transport: "streamable-http",
        sessions: sessions.size,
      }));
      return;
    }

    // All MCP traffic goes through /mcp
    if (req.url === "/mcp") {
      // Normalize Accept header — some clients send */* or omit required types.
      // The SDK requires both application/json and text/event-stream.
      // Must patch both req.headers AND req.rawHeaders since @hono/node-server
      // reads from rawHeaders when converting to Web Standard Request.
      const accept = req.headers["accept"] || "";
      if (accept.includes("*/*") || !accept.includes("text/event-stream") || !accept.includes("application/json")) {
        const normalized = "application/json, text/event-stream";
        req.headers["accept"] = normalized;
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
          if (req.rawHeaders[i].toLowerCase() === "accept") {
            req.rawHeaders[i + 1] = normalized;
            break;
          }
        }
      }

      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      if (sessionId && sessions.has(sessionId)) {
        // Existing session
        const session = sessions.get(sessionId)!;
        await session.transport.handleRequest(req, res);
      } else if (req.method === "POST") {
        // New session — initialize transport + server
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => crypto.randomUUID(),
        });
        const server = createServer();
        await server.connect(transport);

        // Capture session ID after first response
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid) sessions.delete(sid);
        };

        await transport.handleRequest(req, res);

        const sid = transport.sessionId;
        if (sid) {
          sessions.set(sid, { server, transport });
        }
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No valid session. Send a POST to initialize." }));
      }
      return;
    }

    // Legacy SSE transport endpoints (for VS Code and other SSE-only clients)
    if (req.url === "/sse" && req.method === "GET") {
      const transport = new SSEServerTransport("/messages", res);
      const server = createServer();
      await server.connect(transport);
      const sid = crypto.randomUUID();
      sseSessions.set(sid, { server, transport });
      transport.onclose = () => sseSessions.delete(sid);
      return;
    }

    if (req.url?.startsWith("/messages") && req.method === "POST") {
      const url = new URL(req.url, `http://localhost:${port}`);
      const sessionId = url.searchParams.get("sessionId");
      const session = sessionId ? sseSessions.get(sessionId) : [...sseSessions.values()].at(-1);
      if (session) {
        await session.transport.handlePostMessage(req, res);
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No active SSE session" }));
      }
      return;
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found. Use /mcp, /sse, or /health." }));
  });

  httpServer.listen(port, () => {
    console.error(`VecTrade MCP Server listening on :${port}`);
    console.error(`  → Streamable HTTP: http://localhost:${port}/mcp`);
    console.error(`  → Legacy SSE:      http://localhost:${port}/sse`);
    console.error(`  → Health:          http://localhost:${port}/health`);
  });

  process.on("SIGINT", async () => {
    for (const { server } of sessions.values()) {
      await server.close();
    }
    for (const { server } of sseSessions.values()) {
      await server.close();
    }
    httpServer.close();
    process.exit(0);
  });

  // Keep process alive
  await new Promise(() => {});
}

/**
 * Legacy SSE transport — single-connection per process.
 * Maintained for backward compatibility with older MCP clients.
 */
async function startSSEServer(): Promise<void> {
  const { SSEServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/sse.js"
  );
  const { createServer: createHTTPServer } = await import("node:http");
  const port = parseInt(process.env.PORT || "3200", 10);

  const sessions = new Map<string, { server: ReturnType<typeof createServer>; transport: InstanceType<typeof SSEServerTransport> }>();

  const httpServer = createHTTPServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "ok",
        server: "vectrade-mcp",
        transport: "sse",
        sessions: sessions.size,
      }));
      return;
    }

    if (req.url === "/sse") {
      const transport = new SSEServerTransport("/messages", res);
      const server = createServer();
      await server.connect(transport);
      const sid = crypto.randomUUID();
      sessions.set(sid, { server, transport });
      transport.onclose = () => sessions.delete(sid);
      return;
    }

    if (req.url?.startsWith("/messages") && req.method === "POST") {
      // Route to the right session based on query param or most recent
      const url = new URL(req.url, `http://localhost:${port}`);
      const sid = url.searchParams.get("sessionId");
      const session = sid ? sessions.get(sid) : [...sessions.values()].at(-1);
      if (session) {
        await session.transport.handlePostMessage(req, res);
      } else {
        res.writeHead(400);
        res.end("No active session");
      }
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  httpServer.listen(port, () => {
    console.error(`VecTrade MCP Server (SSE) listening on :${port}`);
    console.error(`  → SSE endpoint: http://localhost:${port}/sse`);
    console.error(`  → Health:       http://localhost:${port}/health`);
  });

  process.on("SIGINT", async () => {
    for (const { server } of sessions.values()) {
      await server.close();
    }
    httpServer.close();
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
