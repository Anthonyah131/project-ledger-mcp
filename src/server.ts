import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerContextTools } from "./tools/context.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerExpenseTools } from "./tools/expenses.js";
import { registerIncomeTools } from "./tools/income.js";
import { registerObligationTools } from "./tools/obligations.js";
import { registerSummaryTools } from "./tools/summary.js";

export interface ServerContext {
  /** Raw Bearer JWT forwarded from the incoming request. */
  token: string;
}

/**
 * Creates and configures a new McpServer instance for a single request.
 * Tools receive `context` via closure so they can forward the token to the SaaS API.
 *
 * @param context - Per-request context carrying the caller's Bearer token.
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
