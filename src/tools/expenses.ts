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
 * Registers expense tools:
 *   get_expense_totals        → GET /api/mcp/expenses/totals
 *   get_expenses_by_category  → GET /api/mcp/expenses/by-category
 *   get_expenses_by_project   → GET /api/mcp/expenses/by-project
 *   get_expense_trends        → GET /api/mcp/expenses/trends
 */
export function registerExpenseTools(
  server: McpServer,
  context: ServerContext
): void {
  // ── Totals ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_expense_totals",
    "Get spending totals and optional period comparison.",
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
      from: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Start date in YYYY-MM-DD format. Omit when user did not request a start date. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. End date in YYYY-MM-DD format. Omit when user did not request an end date. Do not send natural-language dates."
        ),
      comparePreviousPeriod: z
        .preprocess(
          coerceOptionalBoolean,
          z.union([z.boolean(), z.string()]).optional()
        )
        .describe(
          "Optional. true includes previous-period comparison metrics, false disables comparison. Omit when comparison is not requested."
        ),
      categoryId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Expense category UUID from trusted data context. Never invent IDs or use category name/template placeholders. Omit when category is not specified."
        ),
      categoryName: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Category name for fuzzy matching (equals, startsWith, contains; case-insensitive). Omit when no category name is provided."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/expenses/totals", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── By Category ────────────────────────────────────────────────────────────
  server.tool(
    "get_expenses_by_category",
    "Get spending by category with optional trends.",
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
      from: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Start date in YYYY-MM-DD format. Omit when user did not request a start date. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. End date in YYYY-MM-DD format. Omit when user did not request an end date. Do not send natural-language dates."
        ),
      top: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Maximum categories to return (integer 1..100). Omit to use backend default (10)."
        ),
      includeOthers: z
        .preprocess(
          coerceOptionalBoolean,
          z.union([z.boolean(), z.string()]).optional()
        )
        .describe(
          "Optional. true groups remaining categories into Others. Omit when user did not request an Others bucket."
        ),
      includeTrend: z
        .preprocess(
          coerceOptionalBoolean,
          z.union([z.boolean(), z.string()]).optional()
        )
        .describe(
          "Optional. true includes trend delta versus previous period. Omit when trend comparison is not requested."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/expenses/by-category", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── By Project ─────────────────────────────────────────────────────────────
  server.tool(
    "get_expenses_by_project",
    "Get spending by project with budget context.",
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
      from: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Start date in YYYY-MM-DD format. Omit when user did not request a start date. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. End date in YYYY-MM-DD format. Omit when user did not request an end date. Do not send natural-language dates."
        ),
      top: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Maximum projects to return (integer 1..100). Omit to use backend default (10)."
        ),
      includeBudgetContext: z
        .preprocess(
          coerceOptionalBoolean,
          z.union([z.boolean(), z.string()]).optional()
        )
        .describe(
          "Optional. true includes budget usage context per project. Omit to use backend default (typically true)."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/expenses/by-project", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Trends ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_expense_trends",
    "Get expense time series by period.",
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
      from: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Start date in YYYY-MM-DD format. Omit to let backend apply default range for the selected granularity. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. End date in YYYY-MM-DD format. Omit to let backend apply default range for the selected granularity. Do not send natural-language dates."
        ),
      granularity: z
        .preprocess(coerceOptionalLowercaseString, z.string().optional())
        .describe(
          "Optional. Time bucketing value. Accepts variants like day/daily, week/weekly, month/monthly; unknown values are handled by backend fallback. Omit to use default month."
        ),
      categoryId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Expense category UUID from trusted data context. Never invent IDs or use category name/template placeholders. Omit when category is not specified."
        ),
      categoryName: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Category name for fuzzy matching (equals, startsWith, contains; case-insensitive). Omit when no category name is provided."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/expenses/trends", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
