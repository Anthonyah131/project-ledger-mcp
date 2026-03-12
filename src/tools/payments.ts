import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
import type { ServerContext } from "../server.js";

/**
 * Registers payment tools:
 *   get_pending_payments    → GET /api/mcp/payments/pending
 *   get_received_payments   → GET /api/mcp/payments/received
 *   get_overdue_payments    → GET /api/mcp/payments/overdue
 *   get_payments_by_method  → GET /api/mcp/payments/by-method
 */
export function registerPaymentTools(
  server: McpServer,
  context: ServerContext
): void {
  // ── Pending ────────────────────────────────────────────────────────────────
  server.tool(
    "get_pending_payments",
    "Get pending payments with remaining balances.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      dueBefore: z
        .string()
        .optional()
        .describe("Due before date"),
      dueAfter: z
        .string()
        .optional()
        .describe("Due after date"),
      minRemainingAmount: z
        .number()
        .optional()
        .describe("Minimum remaining balance"),
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
        const data = await context.apiClient("/api/mcp/payments/pending", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Received ───────────────────────────────────────────────────────────────
  server.tool(
    "get_received_payments",
    "Get received income payments.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start income date"),
      to: z
        .string()
        .optional()
        .describe("End income date"),
      paymentMethodId: z
        .string()
        .optional()
        .describe("Payment method ID"),
      categoryId: z.string().optional().describe("Category ID"),
      minAmount: z
        .number()
        .optional()
        .describe("Minimum payment amount"),
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
        .enum(["title", "amount", "project"])
        .optional()
        .describe("Sort field"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction"),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/payments/received", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── Overdue ────────────────────────────────────────────────────────────────
  server.tool(
    "get_overdue_payments",
    "Get overdue payments with remaining balances.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Single project ID"),
      overdueDaysMin: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Minimum overdue days"),
      minRemainingAmount: z
        .number()
        .optional()
        .describe("Minimum remaining balance"),
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
        const data = await context.apiClient("/api/mcp/payments/overdue", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );

  // ── By Method ──────────────────────────────────────────────────────────────
  server.tool(
    "get_payments_by_method",
    "Get payment totals by method.",
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
      direction: z
        .enum(["expense", "income", "both"])
        .optional()
        .describe("Transaction direction"),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum methods returned"),
    },
    async (args) => {
      try {
        const data = await context.apiClient("/api/mcp/payments/by-method", args);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
