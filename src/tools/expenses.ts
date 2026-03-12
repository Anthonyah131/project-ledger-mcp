import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
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
        .string()
        .optional()
        .describe("Single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD"),
      to: z
        .string()
        .optional()
        .describe("End date YYYY-MM-DD"),
      comparePreviousPeriod: z
        .boolean()
        .optional()
        .describe("Compare previous period"),
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
        .string()
        .optional()
        .describe("Single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD"),
      to: z
        .string()
        .optional()
        .describe("End date YYYY-MM-DD"),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum categories returned"),
      includeOthers: z
        .boolean()
        .optional()
        .describe("Group remaining categories"),
      includeTrend: z
        .boolean()
        .optional()
        .describe("Include category trend delta"),
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
      from: z
        .string()
        .optional()
        .describe("Start date YYYY-MM-DD"),
      to: z
        .string()
        .optional()
        .describe("End date YYYY-MM-DD"),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum projects returned"),
      includeBudgetContext: z
        .boolean()
        .optional()
        .describe("Include budget usage"),
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
        .string()
        .optional()
        .describe("Single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start date or default"),
      to: z
        .string()
        .optional()
        .describe("End date or default"),
      granularity: z
        .enum(["day", "week", "month"])
        .optional()
        .describe("Bucket size"),
      categoryId: z
        .string()
        .optional()
        .describe("Expense category ID"),
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
