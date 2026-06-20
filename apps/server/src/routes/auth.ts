import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { verifyPassword } from "../lib/password";
import { signStaffToken } from "../lib/jwt";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error-handler";
import type { AppEnv } from "../types";

const auth = new Hono<AppEnv>();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

auth.post("/login", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = loginSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, "username and password are required");
  }

  const staff = await prisma.staff.findUnique({ where: { username: body.data.username } });

  if (!staff || !staff.active) {
    throw new ApiError(401, "Invalid username or password");
  }

  const valid = await verifyPassword(body.data.password, staff.passwordHash);

  if (!valid) {
    throw new ApiError(401, "Invalid username or password");
  }

  const token = await signStaffToken({ sub: staff.id, role: staff.role });

  return c.json({
    token,
    staff: { id: staff.id, username: staff.username, role: staff.role },
  });
});

auth.get("/me", requireAuth, (c) => {
  const staff = c.get("staff");
  return c.json({ id: staff.id, username: staff.username, role: staff.role });
});

export default auth;
