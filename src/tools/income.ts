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
 * Registers income tools:
 *   get_income_by_period   → GET /api/mcp/income/by-period
 *   get_income_by_project  → GET /api/mcp/income/by-project
 */
export function registerIncomeTools(
  server: McpServer,
  context: ServerContext
): void {
  // ── By Period ──────────────────────────────────────────────────────────────
  server.tool(
    "get_income_by_period",
    "Get income time series with optional comparison.",
    {
      projectId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
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
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["day", "week", "month"]).optional()
        )
        .describe(
          "Optional. Allowed values: day, week, month. Omit to use default month."
        ),
      comparePreviousPeriod: z
        .preprocess(
          coerceOptionalBoolean,
          z.union([z.boolean(), z.string()]).optional()
        )
        .describe(
          "Optional. true includes previous-period comparison metrics, false disables comparison. Omit when comparison is not requested."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/income/by-period", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── By Project ─────────────────────────────────────────────────────────────
  server.tool(
    "get_income_by_project",
    "Get income by project.",
    {
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
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/income/by-project", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
