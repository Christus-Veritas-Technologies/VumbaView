import { sign, verify } from "hono/jwt";
import { env } from "@vva/env/server";
import type { StaffRole } from "@prisma/client";

export type StaffJwtPayload = {
  sub: string;
  role: StaffRole;
};

// Receptionists/admins use a shared tablet day to day — a long session avoids
// re-logins, the server can still revoke access by deactivating the account.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function signStaffToken(payload: StaffJwtPayload) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  return sign({ ...payload, exp }, env.JWT_SECRET);
}

export async function verifyStaffToken(token: string) {
  return (await verify(token, env.JWT_SECRET)) as StaffJwtPayload & { exp: number };
}
