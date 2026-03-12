import "dotenv/config";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  apiBaseUrl: requireEnv("API_BASE_URL"),
  mcpServiceToken: requireEnv("MCP_SERVICE_TOKEN"),
  port: parseInt(process.env.PORT ?? "3000", 10),
} as const;
