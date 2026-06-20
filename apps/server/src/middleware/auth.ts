import type { Context, Next } from "hono";
import { prisma } from "../db";
import { verifyStaffToken } from "../lib/jwt";
import { ApiError } from "./error-handler";
import type { AppEnv } from "../types";

/** Verifies the bearer JWT and attaches the logged-in Staff to context. */
export async function requireAuth(c: Context<AppEnv>, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

  if (!token) {
    throw new ApiError(401, "Missing bearer token");
  }

  let payload;
  try {
    payload = await verifyStaffToken(token);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const staff = await prisma.staff.findUnique({ where: { id: payload.sub } });

  if (!staff || !staff.active) {
    throw new ApiError(401, "Account not found or deactivated");
  }

  c.set("staff", staff);
  await next();
}
