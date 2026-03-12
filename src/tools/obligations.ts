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
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      dueWithinDays: z
        .number()
        .int()
        .min(1)
        .max(3650)
        .optional()
        .describe(
          "Optional. Days-ahead window (integer 1..3650). Omit to use backend default (30)."
        ),
      minRemainingAmount: z
        .number()
        .optional()
        .describe(
          "Optional. Minimum remaining balance threshold (number). Omit if the user did not ask for an amount floor."
        ),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe(
          "Optional. Allowed values: asc or desc. Omit to use default desc."
        ),
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
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      status: z
        .enum(["open", "partially_paid", "overdue"])
        .optional()
        .describe(
          "Optional. Allowed values: open, partially_paid, overdue. Omit when user did not request a status filter."
        ),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe(
          "Optional. Allowed values: asc or desc. Omit to use default desc."
        ),
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
