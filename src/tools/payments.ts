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
    "Get a paginated list of payment obligations that still have a remaining balance (remainingAmount > 0). Use to answer questions about what payments are still due.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      dueBefore: z
        .string()
        .optional()
        .describe("Only include obligations due before this date (YYYY-MM-DD)"),
      dueAfter: z
        .string()
        .optional()
        .describe("Only include obligations due after this date (YYYY-MM-DD)"),
      minRemainingAmount: z
        .number()
        .optional()
        .describe("Minimum remaining balance to include"),
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
        .describe("Sort direction (default: desc)"),
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
    "Get a paginated list of income payments received. Each item includes the original amount, converted amount, payment method, category, and project. Use to answer questions about cash inflows.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      from: z
        .string()
        .optional()
        .describe("Start of income-date range (YYYY-MM-DD)"),
      to: z
        .string()
        .optional()
        .describe("End of income-date range (YYYY-MM-DD)"),
      paymentMethodId: z
        .string()
        .optional()
        .describe("Filter by payment method ID"),
      categoryId: z.string().optional().describe("Filter by category ID"),
      minAmount: z
        .number()
        .optional()
        .describe("Minimum payment amount to include"),
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
        .enum(["title", "amount", "project"])
        .optional()
        .describe("Field to sort by (default: incomeDate)"),
      sortDirection: z
        .enum(["asc", "desc"])
        .optional()
        .describe("Sort direction (default: desc)"),
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
    "Get a paginated list of overdue payment obligations that still have a remaining balance. Use to answer questions about late or missed payments.",
    {
      projectId: z
        .string()
        .optional()
        .describe("Filter results to a single project ID"),
      overdueDaysMin: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Minimum number of days past the due date to include (default: 0)"
        ),
      minRemainingAmount: z
        .number()
        .optional()
        .describe("Minimum remaining balance to include"),
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
        .describe("Sort direction (default: desc)"),
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
    "Get payment usage broken down by payment method, showing totalOutgoing, totalIncoming, netFlow, transaction counts, and usagePercentage. Use to analyze which payment methods are most used.",
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
      direction: z
        .enum(["expense", "income", "both"])
        .optional()
        .describe(
          "Which transaction direction to include (default: both)"
        ),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .optional()
        .describe("Maximum number of payment methods to return (default: 10)"),
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
