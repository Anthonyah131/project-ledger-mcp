import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
import {
  coerceOptionalBoolean,
  coerceOptionalLowercaseString,
  coerceOptionalNumber,
  coerceOptionalString,
} from "./schema.js";
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
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      dueBefore: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Upper due-date bound in YYYY-MM-DD format. Omit when not requested. Do not send natural-language dates."
        ),
      dueAfter: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Lower due-date bound in YYYY-MM-DD format. Omit when not requested. Do not send natural-language dates."
        ),
      minRemainingAmount: z
        .preprocess(coerceOptionalNumber, z.number().optional())
        .describe(
          "Optional. Minimum remaining balance threshold (number). Omit if the user did not ask for an amount floor."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(1).max(100).optional()
        )
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortDirection: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["asc", "desc"]).optional()
        )
        .describe(
          "Optional. Allowed values: asc or desc. Omit to use default desc."
        ),
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
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      from: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Start date filter in YYYY-MM-DD format. Omit when user did not request a start date. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. End date filter in YYYY-MM-DD format. Omit when user did not request an end date. Do not send natural-language dates."
        ),
      paymentMethodId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Payment method UUID from trusted data context. Never invent IDs or use labels/template expressions. Omit if method is unknown."
        ),
      categoryId: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Category UUID from trusted data context. Never invent IDs or use category name as ID. Omit if category is not explicitly provided."
        ),
      minAmount: z
        .preprocess(coerceOptionalNumber, z.number().optional())
        .describe(
          "Optional. Minimum payment amount threshold (number). Omit if the user did not ask for an amount floor."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(1).max(100).optional()
        )
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortBy: z
        .preprocess(
          coerceOptionalString,
          z.enum(["title", "amount", "project"]).optional()
        )
        .describe(
          "Optional. Allowed values: title, amount, project. Omit to use backend fallback sort (incomeDate)."
        ),
      sortDirection: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["asc", "desc"]).optional()
        )
        .describe(
          "Optional. Allowed values: asc or desc. Omit to use default desc."
        ),
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
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      overdueDaysMin: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(0).optional()
        )
        .describe(
          "Optional. Minimum overdue days threshold (integer >= 0). Omit to use backend default (0)."
        ),
      minRemainingAmount: z
        .preprocess(coerceOptionalNumber, z.number().optional())
        .describe(
          "Optional. Minimum remaining balance threshold (number). Omit if the user did not ask for an amount floor."
        ),
      page: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().positive().optional()
        )
        .describe(
          "Optional. Pagination page number (integer >= 1). Omit to use default page 1."
        ),
      pageSize: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(1).max(100).optional()
        )
        .describe(
          "Optional. Pagination size (integer 1..100). Omit to use backend default page size."
        ),
      sortDirection: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["asc", "desc"]).optional()
        )
        .describe(
          "Optional. Allowed values: asc or desc. Omit to use default desc."
        ),
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
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Project UUID from get_context visibleProjects[]. Never invent IDs and never use project name, userId, or template placeholders. Omit if user did not specify a project."
        ),
      from: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. Start date in YYYY-MM-DD format. Omit when user did not request a lower bound. Do not send natural-language dates."
        ),
      to: z
        .preprocess(coerceOptionalString, z.string().optional())
        .describe(
          "Optional. End date in YYYY-MM-DD format. Omit when user did not request an upper bound. Do not send natural-language dates."
        ),
      direction: z
        .preprocess(
          coerceOptionalLowercaseString,
          z.enum(["expense", "income", "both"]).optional()
        )
        .describe(
          "Optional. Allowed values: expense, income, both. Omit to use default both."
        ),
      top: z
        .preprocess(
          coerceOptionalNumber,
          z.number().int().min(1).max(100).optional()
        )
        .describe(
          "Optional. Maximum number of methods to return (integer 1..100). Omit to use backend default (10)."
        ),
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
