import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
import {
  coerceOptionalNumber,
  coerceOptionalString,
} from "./schema.js";
import type { ServerContext } from "../server.js";

/**
 * Registers summary tools:
 *   get_financial_health  → GET /api/mcp/summary/financial-health
 *   get_monthly_overview  → GET /api/mcp/summary/monthly-overview
 *   get_alerts            → GET /api/mcp/summary/alerts
 */
export function registerSummaryTools(
  server: McpServer,
  context: ServerContext
): void {
  // ── Financial Health ───────────────────────────────────────────────────────
  server.tool(
    "get_financial_health",
    "Get overall financial health and key signals.",
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
          "Optional. Evaluation start date in YYYY-MM-DD format. Omit when user did not request a start date. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Evaluation end date in YYYY-MM-DD format. Omit when user did not request an end date. Do not send natural-language dates."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient(
          "/api/mcp/summary/financial-health",
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Monthly Overview ───────────────────────────────────────────────────────
  server.tool(
    "get_monthly_overview",
    "Get monthly financial overview and alerts.",
    {
      month: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Month in YYYY-MM format. Omit to use current month. Do not send natural-language values like this month or este mes."
        ),
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
    },
    async (args) => {
      try {
        const data = await context.apiClient(
          "/api/mcp/summary/monthly-overview",
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Alerts ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_alerts",
    "Get active financial alerts by priority.",
    {
      month: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Month in YYYY-MM format. Omit to use current month. Do not send natural-language values like this month or este mes."
        ),
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
      minPriority: z
        .preprocess(
          coerceOptionalNumber,
          z.union([z.number().int(), z.string()]).optional()
        )
        .describe(
          "Optional. Minimum alert priority threshold (integer 0..100). Omit to use backend default (0)."
        ),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/summary/alerts", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
