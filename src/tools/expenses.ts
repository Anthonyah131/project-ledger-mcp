import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchMcpApi, toolOk, toolFail } from "../api-client.js";
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
    "Get total spending for a period: totalSpent, transactionCount, and averageExpense. Optionally compare against the equivalent previous period to get deltaAmount and deltaPercentage.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start of date range (YYYY-MM-DD)"),
      to: z
        .string()
        .optional()
        .describe("End of date range (YYYY-MM-DD)"),
      comparePreviousPeriod: z
        .boolean()
        .optional()
        .describe(
          "Include comparison against the same-length previous period (default: false)"
        ),
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/expenses/totals",
          context.token,
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── By Category ────────────────────────────────────────────────────────────
  server.tool(
    "get_expenses_by_category",
    "Get spending distribution broken down by expense category, showing amount, count, and percentage per category. Optionally includes an 'Others' bucket and trend delta vs the previous period.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start of date range (YYYY-MM-DD)"),
      to: z
        .string()
        .optional()
        .describe("End of date range (YYYY-MM-DD)"),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of categories to return (default: 10)"),
      includeOthers: z
        .boolean()
        .optional()
        .describe("Aggregate remaining categories into an 'Others' bucket"),
      includeTrend: z
        .boolean()
        .optional()
        .describe(
          "Calculate trendDelta for each category vs the previous period"
        ),
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/expenses/by-category",
          context.token,
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── By Project ─────────────────────────────────────────────────────────────
  server.tool(
    "get_expenses_by_project",
    "Get spending distribution broken down by project, showing totalSpent, expenseCount, and optional budget context (budget amount and budgetUsedPercentage).",
    {
      from: z
        .string()
        .optional()
        .describe("Start of date range (YYYY-MM-DD)"),
      to: z
        .string()
        .optional()
        .describe("End of date range (YYYY-MM-DD)"),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of projects to return (default: 10)"),
      includeBudgetContext: z
        .boolean()
        .optional()
        .describe(
          "Include active budget amount and usage percentage (default: true)"
        ),
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/expenses/by-project",
          context.token,
          args
        );
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Trends ─────────────────────────────────────────────────────────────────
  server.tool(
    "get_expense_trends",
    "Get a time-series of expense spending aggregated by day, week, or month. Returns the effective date range and an array of data points (periodStart, periodLabel, totalSpent, expenseCount). Defaults: day → last 30 days, week → last 12 weeks, month → last 12 months.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start of date range (YYYY-MM-DD); uses default if omitted"),
      to: z
        .string()
        .optional()
        .describe("End of date range (YYYY-MM-DD); uses default if omitted"),
      granularity: z
        .enum(["day", "week", "month"])
        .optional()
        .describe("Time bucket size (default: month)"),
      categoryId: z
        .string()
        .optional()
        .describe("Filter to a specific expense category ID"),
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/expenses/trends",
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
