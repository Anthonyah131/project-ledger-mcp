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
    "Get an overall financial health score (0\u2013100) combining net balance, overdue obligations, budget pressure, and income vs spending. Also returns totalIncome, totalSpent, netBalance, burnRatePerDay, budgetRiskProjects, overdueObligationsCount, and keySignals. Use as the primary entry point for financial health questions.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Scope the score to a single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start of evaluation period (YYYY-MM-DD)"),
      to: z
        .string()
        .optional()
        .describe("End of evaluation period (YYYY-MM-DD)"),
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
    "Get a consolidated monthly summary including KPIs (totalSpent, totalIncome, netBalance, transaction counts), top expense categories, payment method split, per-project health, and active alerts. Use for month-level reporting or when the user asks about a specific month.",
    {
      month: z
        .string()
        .optional()
        .describe(
          "Month to summarize in YYYY-MM format (default: current month)"
        ),
      projectId: z
        .string()
        .optional()
        .describe("Scope the overview to a single project ID"),
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
    "Get active financial alerts ordered by priority (highest first). Alert codes include BUDGET_OVER_80, OVERDUE_OBLIGATIONS, and NEGATIVE_NET. Use to surface warnings and actionable issues to the user.",
    {
      month: z
        .string()
        .optional()
        .describe("Month to evaluate in YYYY-MM format (default: current month)"),
      projectId: z
        .string()
        .optional()
        .describe("Scope alerts to a single project ID"),
      minPriority: z
        .number()
        .int()
        .min(0)
        .max(100)
        .optional()
        .describe("Minimum priority threshold to include (0\u2013100)"),
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
