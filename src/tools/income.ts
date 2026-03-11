import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchMcpApi, toolOk, toolFail } from "../api-client.js";
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
    "Get a time-series of income aggregated by day, week, or month. Returns totalIncome, incomeCount, optional period-over-period delta, and an array of data points (periodStart, periodLabel, totalIncome). Defaults: day → last 30 days, week → last 12 weeks, month → last 12 months.",
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
          "/api/mcp/income/by-period",
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
    "get_income_by_project",
    "Get income distribution broken down by project, showing totalIncome, currency, and income transaction count. Use to compare revenue across projects.",
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
    },
    async (args) => {
      try {
        const data = await fetchMcpApi(
          "/api/mcp/income/by-project",
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
