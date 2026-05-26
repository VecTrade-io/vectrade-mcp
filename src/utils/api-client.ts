/**
 * VecTrade API HTTP client.
 *
 * Resolves the API key in this priority:
 *  1. Per-request key from X-API-Key header (via AsyncLocalStorage context)
 *  2. VECTRADE_API_KEY environment variable (for local stdio usage)
 */

import { getRequestApiKey } from "./request-context.js";

const DEFAULT_BASE_URL = "https://api.vectrade.io/v1";
const DEFAULT_TIMEOUT = 30_000;

interface APIResponse<T = unknown> {
  data: T;
  status: number;
}

interface APIError {
  message: string;
  code: string;
  status: number;
}

export class VecTradeAPIClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.VECTRADE_BASE_URL || DEFAULT_BASE_URL;
    this.timeout = parseInt(
      process.env.VECTRADE_TIMEOUT || String(DEFAULT_TIMEOUT),
      10
    );
  }

  private resolveApiKey(): string {
    const key = getRequestApiKey() || process.env.VECTRADE_API_KEY || "";
    if (!key) {
      throw new Error(
        "API key required. Pass X-API-Key header (hosted) or set " +
          "VECTRADE_API_KEY env var (local). " +
          "Get a free key at https://vectrade.io/vtrade/developer"
      );
    }
    return key;
  }

  async get<T = unknown>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-API-Key": this.resolveApiKey(),
        "User-Agent": "vectrade-mcp-server/1.0.0",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({
        message: response.statusText,
        code: "UNKNOWN",
        status: response.status,
      }))) as APIError;
      throw new Error(
        `VecTrade API error (${error.status}): ${error.message}`
      );
    }

    const body = (await response.json()) as APIResponse<T>;
    return body.data;
  }

  async post<T = unknown>(path: string, data?: unknown): Promise<T> {
    const url = new URL(path, this.baseUrl);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-API-Key": this.resolveApiKey(),
        "User-Agent": "vectrade-mcp-server/1.0.0",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({
        message: response.statusText,
        code: "UNKNOWN",
        status: response.status,
      }))) as APIError;
      throw new Error(
        `VecTrade API error (${error.status}): ${error.message}`
      );
    }

    const body = (await response.json()) as APIResponse<T>;
    return body.data;
  }
}

// Singleton instance (safe to create eagerly — API key resolved per-request)
const client = new VecTradeAPIClient();

export function getClient(): VecTradeAPIClient {
  return client;
}
