# Project Ledger MCP Server — Workspace Instructions

## Project Overview

This is a **stateless HTTP MCP server** (Model Context Protocol) that acts as a thin proxy between an AI agent/chatbot and the Project Ledger SaaS REST API (`/api/mcp`). All business logic lives in the backend API; this server handles token extraction, Zod input validation, and response forwarding.

- **Language**: TypeScript (strict, ES2022, NodeNext modules)
- **Runtime**: Node.js with Express
- **Transport**: `StreamableHTTPServerTransport` — one McpServer + one Transport created **per request** (fully stateless, no sessions)
- **Tools**: 19 MCP tools covering context, projects, payments, expenses, income, obligations, and summaries

## Commands

```bash
npm run build   # Compile TypeScript → dist/
npm run dev     # Development: tsx watch mode
npm start       # Production: node dist/index.js
```

## Architecture

```
src/
  index.ts        # Express entry: /health + /mcp endpoints. Creates server+transport per request.
  server.ts       # createMcpServer(context) factory — registers all tool groups via closures
  auth.ts         # Extracts Bearer JWT from Authorization header
  api-client.ts   # fetchMcpApi(path, token, params) — authenticated GET to SaaS API
  config.ts       # Loads .env: API_BASE_URL (required), PORT (optional, default 3000)
  tools/
    context.ts      # get_context
    projects.ts     # get_project_portfolio, get_project_deadlines, get_project_activity_split
    payments.ts     # get_pending_payments, get_received_payments, get_overdue_payments, get_payments_by_method
    expenses.ts     # get_expense_totals, get_expenses_by_category, get_expenses_by_project, get_expense_trends
    income.ts       # get_income_by_period, get_income_by_project
    obligations.ts  # get_upcoming_obligations, get_unpaid_obligations
    summary.ts      # get_financial_health, get_monthly_overview, get_alerts
```

## Key Patterns

### Per-request stateless server
`/mcp` POST creates a fresh `McpServer` + `StreamableHTTPServerTransport` on every request. Resources are cleaned up on `res.on('finish')`. Never add session state.

### Token forwarding via closure
The Bearer JWT is extracted in `index.ts`, passed to `createMcpServer({ token })`, and captured by each tool handler via closure. Tools never receive the token as a tool argument.

### Tool implementation pattern
All tools follow this structure:
```typescript
server.tool("tool_name", "Description", { param: z.string().optional() }, async ({ param }) => {
  try {
    const data = await fetchMcpApi("/api/mcp/endpoint", token, { param });
    return toolOk(data);
  } catch (err) {
    return toolFail(err);
  }
});
```

### API client
`fetchMcpApi(path, token, params?)` performs authenticated GET requests. Params with `undefined` values are automatically skipped. Throws `ApiError` on non-2xx responses. Use `toolOk(data)` and `toolFail(err)` to wrap results as MCP content.

### Error handling
- `ApiError`: API response error (has `status` and `message`)
- `toolFail(err)`: handles both `ApiError` and unexpected errors, always returns `isError: true` MCP content
- Never throw from a tool handler — always return `toolFail(err)`

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `API_BASE_URL` | ✅ Yes | — | SaaS API base URL, no trailing slash (e.g. `pledger-api.azurewebsites.net`) |
| `PORT` | No | `3000` | HTTP port the MCP server listens on |

`config.ts` validates `API_BASE_URL` at startup and throws if missing.

## Adding a New Tool

1. Find (or create) the relevant file in `src/tools/`.
2. Add the tool registration inside the exported function that receives `server` and `token`.
3. Use Zod for all input params. Match query param names exactly as documented in `README-MCP.md`.
4. Keep the `path` in `fetchMcpApi` consistent with the `/api/mcp/...` endpoint catalog.
5. Register the new tool function in `src/server.ts`.

## API Endpoint Reference

Full endpoint catalog with query params, response shapes, and business rules is in [`README-MCP.md`](../README-MCP.md).

Key conventions:
- Pagination: `page`, `pageSize` (default 1/20), `sortBy`, `sortDirection` (`asc|desc`)
- Dates: `YYYY-MM-DD` for `DateOnly`; `YYYY-MM` for month fields
- `projectId` is always optional; when omitted, returns data across all visible projects
- `userId` is resolved server-side from the JWT — never pass it as a param

## Pitfalls

- **Do not validate the JWT** in this server — token validation is delegated to the SaaS API.
- **Do not add session management** — the transport is stateless by design (`sessionIdGenerator: undefined`).
- **`API_BASE_URL` must not have a trailing slash** — `fetchMcpApi` prepends it directly to the path.
- **Params are forwarded as-is** — pass query param names exactly as the API expects them (camelCase).
