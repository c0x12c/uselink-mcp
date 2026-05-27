import { fetch, FormData, type RequestInit } from "undici";

const DEFAULT_BASE_URL = "https://api.uselink.app";

export interface UselinkClientOptions {
  apiKey?: string;
  baseUrl?: string;
}

export class UselinkApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: unknown;

  constructor(
    status: number,
    message: string,
    code: string | undefined,
    details: unknown,
  ) {
    super(message);
    this.name = "UselinkApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    status?: number;
    details?: unknown;
  };
}

export class UselinkClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: UselinkClientOptions = {}) {
    const apiKey = options.apiKey ?? process.env.USELINK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "USELINK_API_KEY is required. Generate one in uselink Settings → Developer.",
      );
    }
    this.apiKey = apiKey;

    const baseUrl = options.baseUrl ?? process.env.USELINK_API_BASE ?? DEFAULT_BASE_URL;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private buildUrl(path: string): string {
    const trimmed = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseUrl}/api/v1/external${trimmed}`;
  }

  private async parseResponse<T>(response: Awaited<ReturnType<typeof fetch>>): Promise<T> {
    const text = await response.text();
    let body: unknown = undefined;
    if (text.length > 0) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!response.ok) {
      const err = body as ErrorBody;
      const message = err?.error?.message ?? `uselink API ${response.status}`;
      const code = err?.error?.code;
      throw new UselinkApiError(response.status, message, code, body);
    }

    return body as T;
  }

  async post<T>(path: string, jsonBody: unknown): Promise<T> {
    const init: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(jsonBody ?? {}),
    };
    const response = await fetch(this.buildUrl(path), init);
    return this.parseResponse<T>(response);
  }

  async postMultipart<T>(path: string, form: FormData): Promise<T> {
    const init: RequestInit = {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
      body: form,
    };
    const response = await fetch(this.buildUrl(path), init);
    return this.parseResponse<T>(response);
  }
}
