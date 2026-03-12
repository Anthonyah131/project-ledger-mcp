import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
import type { ServerContext } from "../server.js";

/**
 * Registers obligation tools:
 *   get_upcoming_obligations → GET /api/mcp/obligations/upcoming
 *   get_unpaid_obligations   → GET /api/mcp/obligations/unpaid
 */
export function registerObligationTools(
  server: McpServer,
  context: ServerContext
): void {
  // ── Upcoming ───────────────────────────────────────────────────────────────
  server.tool(
    "get_upcoming_obligations",
    "Get upcoming obligations with remaining balances.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      dueWithinDays: z
        .number()
        .int()
        .min(1)
        .max(3650)
        .optional()
        .describe("Days ahead to check"),
      minRemainingAmount: z
        .number()
        .optional()
        .describe("Minimum remaining balance"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Results per page"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction"),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/obligations/upcoming", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Unpaid ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_unpaid_obligations",
    "Get unpaid obligations with remaining balances.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      status: z
        .enum(["open", "partially_paid", "overdue"])
        .optional()
        .describe("Obligation status"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Results per page"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction"),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/obligations/unpaid", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
