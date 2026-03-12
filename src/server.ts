import type { Request } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractRequestAuthContext } from "./auth.js";
import { createMcpApiClient, type McpApiClient } from "./apiClient.js";
import { registerContextTools } from "./tools/context.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerExpenseTools } from "./tools/expenses.js";
import { registerIncomeTools } from "./tools/income.js";
import { registerObligationTools } from "./tools/obligations.js";
import { registerSummaryTools } from "./tools/summary.js";

export interface ServerContext {
  /** Fixed service token loaded from env and forwarded to the C# API. */
  serviceToken: string;
  /** Real application user id forwarded from the caller. */
  userId: string;
  /** Preconfigured per-request HTTP client for /api/mcp routes. */
  apiClient: McpApiClient;
}

/**
 * Builds the per-request MCP context from the incoming HTTP request.
 */
export function createServerContext(req: Request): ServerContext | null {
  const authContext = extractRequestAuthContext(req);
  if (!authContext) {
    return null;
  }

  return {
    ...authContext,
    apiClient: createMcpApiClient(authContext.userId),
  };
}

/**
 * Creates and configures a new McpServer instance for a single request.
 * Tools receive `context` via closure so they can forward the service token and user id.
 *
 * @param context - Per-request context for downstream MCP API calls.
 */
export function createMcpServer(context: ServerContext): McpServer {
  const server = new McpServer({
    name: "project-ledger-mcp",
    version: "0.1.0",
  });

  registerContextTools(server, context);
  registerProjectTools(server, context);
  registerPaymentTools(server, context);
  registerExpenseTools(server, context);
  registerIncomeTools(server, context);
  registerObligationTools(server, context);
  registerSummaryTools(server, context);

  return server;
}
