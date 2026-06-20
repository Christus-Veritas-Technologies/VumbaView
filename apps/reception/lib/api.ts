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
