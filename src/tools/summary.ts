import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
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
        .string()
        .optional()
        .describe("Single project ID"),
      from: z
        .string()
        .optional()
        .describe("Evaluation start date"),
      to: z
        .string()
        .optional()
        .describe("Evaluation end date"),
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
        .string()
        .optional()
        .describe("Month YYYY-MM"),
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
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
        .string()
        .optional()
        .describe("Month YYYY-MM"),
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      minPriority: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .describe("Minimum alert priority"),
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
