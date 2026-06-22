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
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_TTL_SECONDS;
  return sign({ ...payload, exp }, env.JWT_SECRET);
}

export async function verifyStaffToken(token: string) {
  // This hono version's verify() has no default algorithm (unlike sign(),
  // which defaults to HS256) — omitting it throws JwtAlgorithmRequired on
  // every call, so it must be passed explicitly to match how tokens are signed.
  return (await verify(token, env.JWT_SECRET, "HS256")) as StaffJwtPayload & { exp: number };
}
