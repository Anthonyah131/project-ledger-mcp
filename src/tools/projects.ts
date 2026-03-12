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
    "Get portfolio health and financial metrics.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      status: z
        .enum(["active", "completed", "at_risk", "inactive"])
        .optional()
        .describe("Project status"),
      activityDays: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Recent activity days"),
      dueInDays: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Upcoming deadline window in days"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Results per page"),
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
        .describe("Sort field"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction"),
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
    "Get project deadlines by due date.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      dueFrom: z
        .string()
        .optional()
        .describe("Due start date"),
      dueTo: z
        .string()
        .optional()
        .describe("Due end date"),
      includeOverdue: z
        .boolean()
        .optional()
        .describe("Include overdue items"),
      page: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number"),
      pageSize: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Results per page"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction"),
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
    "Get project counts by status.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      activityDays: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Recent activity days"),
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
