import { getToken } from "@/lib/storage/token";

// RN's URL class doesn't reliably support relative/query construction across
// engines, so the base+path joining here is done with plain string ops.
const RAW_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

export class ApiClientError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiClientError";
  }
}

// Fired exactly once per genuine 401 from an authenticated request — never
// on a network failure (status 0, see the catch below) and never on the
// login call itself (which passes auth:false and is excluded below). Wired
// from auth-store.ts to clear the session; api.ts can't import the store
// directly (store imports api.ts), so this small pub/sub avoids a circular
// import while still letting any screen's failed request trigger sign-out.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void): void {
  unauthorizedHandler = fn;
}

function buildUrl(path: string, query?: Record<string, string | undefined>): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  let url = `${BASE_URL}${cleanPath}`;

  if (query) {
    const parts = Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    if (parts.length > 0) {
      url += `?${parts.join("&")}`;
    }
  }

  return url;
}

interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | undefined>;
  auth?: boolean;
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const { body, query, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Network request failed — check your connection");
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed (${res.status})`;

    // A real 401 from the server (bad/expired token, deactivated account) —
    // as opposed to a network failure, which never reaches this branch —
    // means the session is genuinely dead. Sign out globally so every
    // screen's reactive `if (!staff) <Redirect href="/login" />` guard
    // takes over, instead of leaving the raw "Invalid or expired token"
    // string on screen with no way forward.
    if (res.status === 401 && auth) {
      unauthorizedHandler?.();
    }

    throw new ApiClientError(res.status, message);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, query?: Record<string, string | undefined>) => request<T>("GET", path, { query }),
  post: <T>(path: string, body?: unknown, opts?: { auth?: boolean }) =>
    request<T>("POST", path, { body, auth: opts?.auth }),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, { body }),
};
