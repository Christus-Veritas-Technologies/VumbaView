import type { Staff } from "@prisma/client";

/** Shared Hono generic env — routers that use `requireAuth` should be
 * created as `new Hono<AppEnv>()` so `c.get("staff")` is typed. */
export type AppEnv = {
  Variables: {
    staff: Staff;
  };
};
