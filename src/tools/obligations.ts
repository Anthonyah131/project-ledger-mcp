import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
import {
  coerceOptionalLowercaseString,
  coerceOptionalNumber,
  coerceOptionalString,
} from "./schema.js";
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
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      projectName: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project name for fuzzy matching (equals, startsWith, contains; case-insensitive). Omit when no project name is provided."
        ),
      dueWithinDays: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Days-ahead window (integer 1..3650). Omit to use backend default (30)."
        ),
      minRemainingAmount: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number(), z.string()]).optional()
        )
        .describe(
          "Optional. Minimum remaining balance threshold (number). Omit if the user did not ask for an amount floor."
        ),
      search: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Case-insensitive partial text filter over obligation title/description. Omit when no text search is requested."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortDirection: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["asc", "desc"]).optional()
        )
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
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      projectName: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project name for fuzzy matching (equals, startsWith, contains; case-insensitive). Omit when no project name is provided."
        ),
      status: z
        .preprocess(coerceOptionalLowercaseString, z.string().optional())
        .describe(
          "Optional. Case-insensitive obligation status filter. Common values: open, partially_paid, overdue. Omit when user did not request a status filter."
        ),
      search: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Case-insensitive partial text filter over obligation title/description. Omit when no text search is requested."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortDirection: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["asc", "desc"]).optional()
        )
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
