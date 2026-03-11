import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { fetchMcpApi, toolOk, toolFail } from "../api-client.js";
import type { ServerContext } from "../server.js";

/**
 * Registers the context tool.
 * Tool: get_context → GET /api/mcp/context
 */
export function registerContextTools(
  server: McpServer,
  context: ServerContext
): void {
  server.tool(
    "get_context",
    "Get the current user context: userId, default currency, plan permissions/limits, and the list of visible projects (projectId, projectName, currencyCode, userRole). Call this first at session start or when context changes before making other queries.",
    {},
    async () => {
      try {
        const data = await fetchMcpApi("/api/mcp/context", context.token);
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
