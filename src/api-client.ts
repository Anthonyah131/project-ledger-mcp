import { config } from "./config.js";

type Params = Record<string, string | number | boolean | undefined>;

/**
 * Makes an authenticated GET request to the Project Ledger MCP API.
 * Skips any param whose value is `undefined`.
 */
export async function fetchMcpApi(
  path: string,
  token: string,
  params?: Params
): Promise<unknown> {
  const url = new URL(`${config.apiBaseUrl}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(`API error ${status}`);
  }
}

/** Wraps a successful API response as MCP tool content. */
export function toolOk(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/** Wraps an API or unexpected error as MCP tool error content. */
export function toolFail(err: unknown) {
  const text =
    err instanceof ApiError
      ? JSON.stringify(err.body, null, 2)
      : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text }],
  };
}
