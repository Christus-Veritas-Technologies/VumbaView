import { sign, verify, decode } from "hono/jwt";
import { env } from "@vva/env/server";
import type { StaffRole } from "@prisma/client";
import { authLog } from "./debug-log";

export type StaffJwtPayload = {
  sub: string;
  role: StaffRole;
};

// Receptionists/admins use a shared tablet day to day — a long session avoids
// re-logins, the server can still revoke access by deactivating the account.
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

// Identifies *which* JWT_SECRET value is in memory without ever logging the
// real value — if a sign and a later verify ever print different
// fingerprints, that's a confirmed secret mismatch (e.g. dev's `bun --hot`
// reloading a module with a stale/changed env value), not a guess.
export function secretFingerprint(secret: string = env.JWT_SECRET): string {
  return `${Bun.hash(secret).toString(16)} (len ${secret.length})`;
}

export function signStaffToken(payload: StaffJwtPayload) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + SESSION_TTL_SECONDS;
  authLog(
    "sign",
    "sub=",
    payload.sub,
    "role=",
    payload.role,
    "iat=",
    iat,
    "exp=",
    exp,
    "secret=",
    secretFingerprint(),
  );
  return sign({ ...payload, exp }, env.JWT_SECRET);
}

export async function verifyStaffToken(token: string) {
  // Decode without checking the signature first — this always succeeds (it's
  // just base64 JSON), so it shows what the token *claims* even when the
  // verified call below throws. That's the difference between "expired",
  // "wrong secret", and "malformed", which the client only ever sees as one
  // generic "Invalid or expired token" message.
  try {
    const { payload: claims } = decode(token);
    const c = claims as Record<string, unknown>;
    authLog(
      "verify:claims",
      "sub=",
      c.sub,
      "iat=",
      c.iat,
      "exp=",
      c.exp,
      "now=",
      Math.floor(Date.now() / 1000),
      "secret=",
      secretFingerprint(),
    );
  } catch (decodeErr) {
    authLog("verify:undecodable", decodeErr);
  }

  return (await verify(token, env.JWT_SECRET)) as StaffJwtPayload & { exp: number };
}
