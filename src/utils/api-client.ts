/**
 * VecTrade API HTTP client.
 */

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
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor() {
    this.apiKey = process.env.VECTRADE_API_KEY || "";
    this.baseUrl = process.env.VECTRADE_BASE_URL || DEFAULT_BASE_URL;
    this.timeout = parseInt(
      process.env.VECTRADE_TIMEOUT || String(DEFAULT_TIMEOUT),
      10
    );

    if (!this.apiKey) {
      throw new Error(
        "VECTRADE_API_KEY environment variable is required. " +
          "Get a free key at https://vectrade.io/vtrade/developer"
      );
    }
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
        "X-API-Key": this.apiKey,
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
        "X-API-Key": this.apiKey,
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

// Singleton instance
let client: VecTradeAPIClient | null = null;

export function getClient(): VecTradeAPIClient {
  if (!client) {
    client = new VecTradeAPIClient();
  }
  return client;
}
