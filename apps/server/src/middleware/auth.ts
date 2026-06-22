import type { Context, Next } from "hono";
import { prisma } from "../db";
import { verifyStaffToken } from "../lib/jwt";
import { ApiError } from "./error-handler";
import type { AppEnv } from "../types";
import { authLog } from "../lib/debug-log";

/** Verifies the bearer JWT and attaches the logged-in Staff to context. */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  authLog(
    "requireAuth:start",
    c.req.method,
    c.req.path,
    "header-present=",
    !!authHeader,
    "token-present=",
    !!token,
  );

  if (!token) {
    authLog("requireAuth:401 missing-bearer-token", c.req.method, c.req.path);
    throw new ApiError(401, "Missing bearer token");
  }

  let payload;
  try {
    payload = await verifyStaffToken(token);
  } catch (err) {
    // The client only ever sees the generic "Invalid or expired token" —
    // this is the one place that shows the *real* reason: signature
    // mismatch (secret changed/differs from sign-time), genuine expiry, or a
    // malformed token are three completely different bugs to chase.
    authLog(
      "requireAuth:401 verify-failed",
      c.req.method,
      c.req.path,
      "name=",
      err instanceof Error ? err.name : typeof err,
      "message=",
      err instanceof Error ? err.message : String(err),
    );
    throw new ApiError(401, "Invalid or expired token");
  }

  authLog("requireAuth:verified", c.req.method, c.req.path, "sub=", payload.sub, "role=", payload.role);

  const staff = await prisma.staff.findUnique({ where: { id: payload.sub } });

  if (!staff || !staff.active) {
    authLog(
      "requireAuth:401 staff-lookup-failed",
      c.req.method,
      c.req.path,
      "sub=",
      payload.sub,
      "found=",
      !!staff,
      "active=",
      staff?.active,
    );
    throw new ApiError(401, "Account not found or deactivated");
  }

  authLog("requireAuth:ok", c.req.method, c.req.path, "staff=", staff.username);

  c.set("staff", staff);
  await next();
}
