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
    "Get user context and visible projects.",
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
