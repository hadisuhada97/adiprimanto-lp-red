const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const API_BASE_URL = RAW_BASE_URL.replace(/\/$/, "");

export const TOKEN_COOKIE = "admin_access_token";

export type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: ApiFieldErrors = {},
    public context: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }

  /** First message for a field, used to render inline validation errors. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

export function readToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_COOKIE}=([^;]*)`));

  return match ? decodeURIComponent(match[1]) : null;
}

export function writeToken(token: string, expiresAt: string): void {
  const expires = new Date(expiresAt).toUTCString();
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${expires}; SameSite=Lax${secure}`;
}

export function clearToken(): void {
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
  locale?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<ApiEnvelope<T>> {
  const { method = "GET", body, auth = false, locale } = options;

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (locale) headers["Accept-Language"] = locale;

  if (auth) {
    const token = readToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    throw new ApiError(
      payload?.message ?? "Something went wrong. Please try again.",
      response.status,
      payload?.errors ?? {},
      payload?.data ?? {},
    );
  }

  return payload as ApiEnvelope<T>;
}
