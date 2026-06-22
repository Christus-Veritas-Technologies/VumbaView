import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { ApiError } from "../middleware/error-handler";
import { getCurrentTerm } from "../lib/term";
import { notifyPaymentRecorded } from "../lib/whatsapp";
import { PAYMENT_CATEGORIES } from "../lib/constants";
import type { AppEnv } from "../types";
import type { PaymentCategory } from "@prisma/client";

const payments = new Hono<AppEnv>();

payments.use("*", requireAuth);

const recordPaymentSchema = z.object({
  studentId: z.string().min(1),
  category: z.enum(PAYMENT_CATEGORIES),
  amount: z.number().positive(),
  note: z.string().optional(),
  occurredAt: z.coerce.date().optional(),
});

payments.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = recordPaymentSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid payment payload");
  }

  const student = await prisma.student.findUnique({ where: { id: body.data.studentId } });

  if (!student) {
    throw new ApiError(404, "Student not found");
  }

  // Resolved here, not trusted from the client — this is what makes a payment
  // synced after an offline term rollover land in the term that's actually
  // current on the server, not whatever term the device thought was active.
  const term = await getCurrentTerm();
  const staff = c.get("staff");

  const payment = await prisma.payment.create({
    data: {
      studentId: student.id,
      category: body.data.category as PaymentCategory,
      amount: body.data.amount,
      note: body.data.note,
      occurredAt: body.data.occurredAt ?? new Date(),
      termId: term.id,
      recordedById: staff.id,
    },
  });

  // Fire-and-forget — the payment is already recorded; a WhatsApp hiccup
  // shouldn't turn a successful write into a failed request.
  void notifyPaymentRecorded(payment, student, staff.username);

  return c.json(payment, 201);
});

payments.get("/", async (c) => {
  const studentId = c.req.query("studentId");

  const list = await prisma.payment.findMany({
    where: studentId ? { studentId } : {},
    orderBy: { occurredAt: "desc" },
    take: 100,
  });

  return c.json(list);
});

const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  category: z.enum(PAYMENT_CATEGORIES).optional(),
  q: z.string().trim().min(1).optional(),
});

// Admin-only browse view: every payment across the school, with the student
// and the receptionist who recorded it joined in, paginated and filterable.
// Kept as its own route (rather than overloading GET /) so the plain
// studentId-scoped list above — used by the offline sync engine — never has
// to change shape.
payments.get("/admin", requireRole("ADMIN"), async (c) => {
  const parsed = adminListQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
    category: c.req.query("category") || undefined,
    q: c.req.query("q") || undefined,
  });

  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters");
  }

  const { page, pageSize, category, q } = parsed.data;

  const where = {
    ...(category ? { category } : {}),
    ...(q ? { student: { fullName: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        student: { select: { fullName: true, admissionNo: true, level: true } },
        recordedBy: { select: { username: true } },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return c.json({
    items: rows.map((p) => ({
      id: p.id,
      category: p.category,
      amount: Number(p.amount),
      note: p.note,
      occurredAt: p.occurredAt,
      studentId: p.studentId,
      studentName: p.student.fullName,
      admissionNo: p.student.admissionNo,
      level: p.student.level,
      recordedBy: p.recordedBy.username,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export default payments;
