import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { createMcpServer, createServerContext } from "./server.js";

const app = express();
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── MCP endpoint ─────────────────────────────────────────────────────────────
// One transport + server instance per request — fully stateless, no sessions.
app.post("/mcp", async (req, res) => {
  const context = createServerContext(req);
  if (!context) {
    res
      .status(400)
      .json({ error: "Missing required X-User-Id header" });
    return;
  }

  const server = createMcpServer(context);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // disable session management → stateless
  });

  // Clean up after the response is fully sent
  res.on("finish", () => {
    transport.close().catch(() => undefined);
    server.close().catch(() => undefined);
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[MCP] Request error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[MCP] Server listening on port ${config.port}`);
});
