import type { Context, Next } from "hono";
import type { StaffRole } from "@prisma/client";
import { ApiError } from "./error-handler";
import type { AppEnv } from "../types";

/** Use after `requireAuth`. Rejects staff whose role isn't in the allowed list. */
export function requireRole(...roles: StaffRole[]) {
  return async (c: Context<AppEnv>, next: Next) => {
    const staff = c.get("staff");

    if (!roles.includes(staff.role)) {
      throw new ApiError(403, "Not permitted for this role");
    }

    await next();
  };
}
