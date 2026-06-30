import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { ApiError } from "../middleware/error-handler";
import { hashPassword } from "../lib/password";
import { STAFF_ROLES, ROOT_ADMIN_USERNAME } from "../lib/constants";
import type { AppEnv } from "../types";
import type { StaffRole } from "@prisma/client";

const staff = new Hono<AppEnv>();

// Account management is Admin-only — receptionists can't create logins.
staff.use("*", requireAuth, requireRole("ADMIN"));

const createStaffSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(STAFF_ROLES),
});

staff.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = createStaffSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid staff payload");
  }

  const existing = await prisma.staff.findUnique({ where: { username: body.data.username } });

  if (existing) {
    throw new ApiError(409, "Username already taken");
  }

  const passwordHash = await hashPassword(body.data.password);
  const created = await prisma.staff.create({
    data: {
      username: body.data.username,
      passwordHash,
      role: body.data.role as StaffRole,
    },
  });

  return c.json(
    { id: created.id, username: created.username, role: created.role, active: created.active },
    201,
  );
});

staff.get("/", async (c) => {
  const list = await prisma.staff.findMany({
    select: { id: true, username: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return c.json(list);
});

const updateStaffSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

// Update a staff account's username and/or password.
// The root admin can be edited (the deactivate guard is separate).
staff.patch("/:id", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = updateStaffSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid payload");
  }

  if (!body.data.username && !body.data.password) {
    throw new ApiError(400, "Provide at least one of username or password to update");
  }

  const id = c.req.param("id");
  const target = await prisma.staff.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Staff account not found");

  const updateData: { username?: string; passwordHash?: string } = {};

  if (body.data.username) {
    // Reject if another account already has this username.
    const conflict = await prisma.staff.findFirst({
      where: { username: body.data.username, NOT: { id } },
    });
    if (conflict) throw new ApiError(409, "Username already taken");
    updateData.username = body.data.username;
  }

  if (body.data.password) {
    updateData.passwordHash = await hashPassword(body.data.password);
  }

  const updated = await prisma.staff.update({ where: { id }, data: updateData });

  return c.json({ id: updated.id, username: updated.username, role: updated.role, active: updated.active });
});

staff.patch("/:id/deactivate", async (c) => {
  const target = await prisma.staff.findUnique({ where: { id: c.req.param("id") } });

  if (!target) {
    throw new ApiError(404, "Staff account not found");
  }

  // The root admin is the one account that can never be locked out —
  // whether they're trying to deactivate themselves or another admin is
  // trying to do it to them.
  if (target.username === ROOT_ADMIN_USERNAME) {
    throw new ApiError(403, "The root admin account can't be deactivated");
  }

  const updated = await prisma.staff.update({
    where: { id: c.req.param("id") },
    data: { active: false },
  });

  return c.json({ id: updated.id, username: updated.username, role: updated.role, active: updated.active });
});

export default staff;
