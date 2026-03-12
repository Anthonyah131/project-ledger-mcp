import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
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
      comparePreviousPeriod: z
        .boolean()
        .optional()
        .describe("Compare previous period"),
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
