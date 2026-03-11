import type { Request } from "express";

/**
 * Extracts the Bearer token from the Authorization request header.
 * Returns null if the header is absent or malformed.
 * Token validation (signature, expiry) is intentionally left to the SaaS API.
 */
export function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim() || null;
}
