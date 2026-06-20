import type { MiddlewareHandler } from "hono";
import { ApiError } from "./error-handler";

type RateLimitOptions = {
  /** Max requests allowed per window, per client IP. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

/**
 * Minimal in-memory sliding-window rate limiter for public, unauthenticated
 * routes (admissions inquiries, contact messages). Single-process only — fine
 * for this app's traffic, but state won't be shared across multiple server
 * instances. Swap for a shared store (e.g. Redis) if that ever matters.
 */
export function rateLimit({ max, windowMs }: RateLimitOptions): MiddlewareHandler {
  const hits = new Map<string, number[]>();

  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((timestamp) => now - timestamp < windowMs);

    if (recent.length >= max) {
      throw new ApiError(429, "Too many requests. Please try again later.");
    }

    recent.push(now);
    hits.set(ip, recent);

    await next();
  };
}
