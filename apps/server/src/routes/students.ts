import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error-handler";
import { ACADEMIC_LEVELS } from "../lib/levels";
import { ENROLLMENT_STATUSES } from "../lib/constants";
import { getCurrentTerm, attachFeeStatus } from "../lib/term";
import type { AppEnv } from "../types";
import type { AcademicLevel, EnrollmentStatus } from "@prisma/client";

const students = new Hono<AppEnv>();

// Both roles can reach these — Admin's app just doesn't surface the
// add/edit screens, per the "admin does no data entry" UI split.
students.use("*", requireAuth);

const studentInput = z.object({
  fullName: z.string().min(1),
  level: z.enum(ACADEMIC_LEVELS),
  dateOfBirth: z.coerce.date().optional(),
  photoUrl: z.url().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  guardianEmail: z.email().optional(),
  guardianAddress: z.string().optional(),
});

const updateStudentSchema = studentInput.partial().extend({
  status: z.enum(ENROLLMENT_STATUSES).optional(),
});

const listQuerySchema = z.object({
  q: z.string().optional(),
  level: z.enum(ACADEMIC_LEVELS).optional(),
  status: z.enum(ENROLLMENT_STATUSES).optional(),
});

students.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = studentInput.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid student payload");
  }

  const staff = c.get("staff");
  const student = await prisma.student.create({
    data: {
      ...body.data,
      level: body.data.level as AcademicLevel,
      createdById: staff.id,
    },
  });

  return c.json(student, 201);
});

students.get("/", async (c) => {
  const query = listQuerySchema.safeParse({
    q: c.req.query("q"),
    level: c.req.query("level"),
    status: c.req.query("status"),
  });

  if (!query.success) {
    throw new ApiError(400, "Invalid query parameters");
  }

  const { q, level, status } = query.data;

  const list = await prisma.student.findMany({
    where: {
      ...(q ? { fullName: { contains: q, mode: "insensitive" as const } } : {}),
      ...(level ? { level: level as AcademicLevel } : {}),
      ...(status ? { status: status as EnrollmentStatus } : {}),
    },
    orderBy: { fullName: "asc" },
  });

  const term = await getCurrentTerm();
  const withFees = await attachFeeStatus(list, term.id);

  return c.json(withFees);
});

students.get("/:id", async (c) => {
  const student = await prisma.student.findUnique({ where: { id: c.req.param("id") } });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  const term = await getCurrentTerm();
  const [withFee] = await attachFeeStatus([student], term.id);

  return c.json(withFee);
});

students.patch("/:id", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = updateStudentSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid student payload");
  }

  const existing = await prisma.student.findUnique({ where: { id: c.req.param("id") } });

  if (!existing) {
    throw new ApiError(404, "Student not found");
  }

  const student = await prisma.student.update({
    where: { id: c.req.param("id") },
    data: {
      ...body.data,
      level: body.data.level ? (body.data.level as AcademicLevel) : undefined,
      status: body.data.status ? (body.data.status as EnrollmentStatus) : undefined,
    },
  });

  return c.json(student);
});

export default students;
