import type { Request } from "express";
import { config } from "./config.js";

/**
 * Per-request authentication values required by the downstream MCP API.
 */
export interface RequestAuthContext {
  serviceToken: string;
  userId: string;
}

/**
 * Extracts the downstream auth context from the incoming request.
 * The service token comes from env and the user id must be forwarded by the caller.
 */
export function extractRequestAuthContext(
  req: Request
): RequestAuthContext | null {
  const headerValue = req.headers["x-user-id"];
  const userId = Array.isArray(headerValue)
    ? headerValue[0]?.trim()
    : headerValue?.trim();

  if (!userId) {
    return null;
  }

  return {
    serviceToken: config.mcpServiceToken,
    userId,
  };
}
