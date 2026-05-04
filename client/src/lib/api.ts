const TOKEN_KEY = "ogp_url_shortener.session_token";

export interface LinkDto {
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  clickCount: number;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}, withAuth = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (withAuth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401 && withAuth) {
    clearToken();
  }

  let body: unknown = null;
  if (res.headers.get("content-type")?.includes("application/json")) {
    body = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const errorBody = body as { error?: string; message?: string } | null;
    throw new ApiError(
      res.status,
      errorBody?.message ?? errorBody?.error ?? `Request failed (${res.status})`,
      errorBody?.error,
    );
  }
  return body as T;
}

export async function authenticate(accessKey: string): Promise<string> {
  const { token } = await request<{ token: string }>(
    "/api/auth",
    { method: "POST", body: JSON.stringify({ accessKey }) },
    false,
  );
  setToken(token);
  return token;
}

export async function shortenUrl(url: string, reuseIfExists = false): Promise<LinkDto> {
  return request<LinkDto>("/api/shorten", {
    method: "POST",
    body: JSON.stringify({ url, reuseIfExists }),
  });
}

export async function listRecent(): Promise<LinkDto[]> {
  const { links } = await request<{ links: LinkDto[] }>("/api/links");
  return links;
}
