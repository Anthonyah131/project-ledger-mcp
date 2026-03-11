import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchMcpApi, toolOk, toolFail } from "../api-client.js";
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
    "Get a paginated list of obligations due within the next N days that still have a remaining balance. Use to answer questions about what payments are coming up soon.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      dueWithinDays: z
        .number()
        .int()
        .min(1)
        .max(3650)
        .optional()
        .describe(
          "How many days ahead to look for due obligations (default: 30)"
        ),
      minRemainingAmount: z
        .number()
        .optional()
        .describe("Minimum remaining balance to include"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number, 1-based (default: 1)"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page (default: 20, max: 100)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default: desc)"),
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/obligations/upcoming",
          context.token,
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Unpaid ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_unpaid_obligations",
    "Get a paginated list of unpaid or partially paid obligations that still have a remaining balance. Optionally filter by status (open, partially_paid, overdue).",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      status: z
        .enum(["open", "partially_paid", "overdue"])
        .optional()
        .describe("Filter by obligation status"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number, 1-based (default: 1)"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page (default: 20, max: 100)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default: desc)"),
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/obligations/unpaid",
          context.token,
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
