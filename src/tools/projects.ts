import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
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
    "Get a paginated portfolio view of projects including status, financial metrics (totalSpent, totalIncome, netBalance), progress, recent activity, upcoming deadlines, and budget context. Use to answer questions about project health and financial standing.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      status: z
        .enum(["active", "completed", "at_risk", "inactive"])
        .optional()
        .describe("Filter by project status"),
      activityDays: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Days window for recent activity (default: 30)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number, 1-based (default: 1)"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page (default: 20, max: 100)"),
      sortBy: z
        .enum([
          "name",
          "status",
          "totalSpent",
          "totalIncome",
          "netBalance",
          "progress",
        ])
        .optional()
        .describe("Field to sort by (default: lastActivityAtUtc)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default: desc)"),
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
    "Get a paginated list of obligation deadlines grouped by project. Only returns obligations with a remaining balance greater than zero. Ordered by dueDate.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      dueFrom: z
        .string()
        .optional()
        .describe("Start of due-date range (YYYY-MM-DD)"),
      dueTo: z
        .string()
        .optional()
        .describe("End of due-date range (YYYY-MM-DD)"),
      includeOverdue: z
        .boolean()
        .optional()
        .describe("Include already-overdue obligations (default: true)"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number, 1-based (default: 1)"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Items per page (default: 20, max: 100)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction for dueDate (default: desc)"),
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
    "Get a count breakdown of projects by status (activeCount, completedCount, atRiskCount, inactiveCount) plus a per-project status list. Useful for high-level portfolio health overview.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      activityDays: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Days window for recent activity (default: 30)"),
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
