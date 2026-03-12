import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { toolOk, toolFail } from "../apiClient.js";
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
        const data = await context.apiClient("/api/mcp/context");
        return toolOk(data);
      } catch (err) {
        return toolFail(err);
      }
    }
  );
}
