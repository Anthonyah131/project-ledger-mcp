import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
import {
  coerceOptionalBoolean,
  coerceOptionalLowercaseString,
  coerceOptionalNumber,
  coerceOptionalString,
} from "./schema.js";
import type { ServerContext } from "../server.js";

/**
 * Registers project tools:
 *   get_project_portfolio      → GET /api/mcp/projects/portfolio
 *   get_project_deadlines      → GET /api/mcp/projects/deadlines
 *   get_project_activity_split → GET /api/mcp/projects/active-vs-completed
 */
export function registerProjectTools(
  server: McpServer,
  context: ServerContext
): void {
  // ── Portfolio ──────────────────────────────────────────────────────────────
  server.tool(
    "get_project_portfolio",
    "Get portfolio health and financial metrics.",
    {
      projectId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if the user did not specify a project."
        ),
      status: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["active", "completed", "at_risk", "inactive"]).optional()
        )
        .describe(
          "Optional. Allowed values: active, completed, at_risk, inactive. Omit when the user did not ask to filter by status."
        ),
      activityDays: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Positive integer window in days for recent activity analysis. Omit to use backend default behavior (typically 30)."
        ),
      dueInDays: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Positive integer window in days for upcoming deadlines context. Omit to use backend default behavior (typically 30)."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(1).max(100).optional()
        )
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortBy: z
        .preprocess(
          coerceOptionalString,
          z
            .enum([
              "name",
              "status",
              "totalSpent",
              "totalIncome",
              "netBalance",
              "progress",
            ])
            .optional()
        )
        .describe(
          "Optional. Allowed values: name, status, totalSpent, totalIncome, netBalance, progress. Omit to use backend fallback sort."
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
        const data = await context.apiClient("/api/mcp/projects/portfolio", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Deadlines ──────────────────────────────────────────────────────────────
  server.tool(
    "get_project_deadlines",
    "Get project deadlines by due date.",
    {
      projectId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never send project name/userId/template strings. Omit if project is not specified."
        ),
      dueFrom: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Lower due-date bound in YYYY-MM-DD format. Omit when no start bound is requested. Do not send natural-language dates."
        ),
      dueTo: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Upper due-date bound in YYYY-MM-DD format. Omit when no end bound is requested. Do not send natural-language dates."
        ),
      includeOverdue: z
        .preprocess(coerceOptionalBoolean, z.boolean().optional())
        .describe(
          "Optional. true includes overdue obligations, false excludes them. Omit to use backend default (true)."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(1).max(100).optional()
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
        const data = await context.apiClient("/api/mcp/projects/deadlines", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Active vs Completed ────────────────────────────────────────────────────
  server.tool(
    "get_project_activity_split",
    "Get project counts by status.",
    {
      projectId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never send project name/userId/template strings. Omit if project is not specified."
        ),
      activityDays: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Positive integer window in days for status activity computation. Omit to use backend default behavior (typically 30)."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient(
          "/api/mcp/projects/active-vs-completed",
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
