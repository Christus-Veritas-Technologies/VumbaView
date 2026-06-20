import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../middleware/error-handler";
import { getCurrentTerm } from "../lib/term";
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

export default payments;
