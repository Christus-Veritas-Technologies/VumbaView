import { Hono } from "hono";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { ACADEMIC_LEVELS } from "../lib/levels";
import { getCurrentTerm } from "../lib/term";
import { studentJoinedMessage, paymentMadeMessage } from "../lib/event-templates";
import type { AppEnv } from "../types";

const dashboard = new Hono<AppEnv>();

// Dashboard is Admin-only — receptionists don't see collection figures.
dashboard.use("*", requireAuth, requireRole("ADMIN"));

dashboard.get("/enrollment", async (c) => {
  const counts = await prisma.student.groupBy({
    by: ["level"],
    where: { status: "ACTIVE" },
    _count: { _all: true },
  });

  const byLevel = new Map(counts.map((row) => [row.level, row._count._all]));
  const enrollment = ACADEMIC_LEVELS.map((level) => ({ level, count: byLevel.get(level) ?? 0 }));
  const total = enrollment.reduce((sum, row) => sum + row.count, 0);

  return c.json({ total, byLevel: enrollment });
});

// Term-independent headline counts — meaningful even before any term has
// been started, so this must never call getCurrentTerm().
dashboard.get("/summary", async (c) => {
  const [studentsCount, paymentsCount] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.payment.count(),
  ]);

  return c.json({ studentsCount, paymentsCount });
});

dashboard.get("/fees", async (c) => {
  const term = await getCurrentTerm();

  const [feeRows, enrollmentCounts, paidAgg] = await Promise.all([
    prisma.termLevelFee.findMany({ where: { termId: term.id } }),
    prisma.student.groupBy({ by: ["level"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.payment.aggregate({
      where: { termId: term.id, category: "FEES" },
      _sum: { amount: true },
    }),
  ]);

  const feeByLevel = new Map(feeRows.map((r) => [r.level, Number(r.amount)]));
  const countByLevel = new Map(enrollmentCounts.map((r) => [r.level, r._count._all]));

  const expected = ACADEMIC_LEVELS.reduce(
    (sum, level) => sum + (feeByLevel.get(level) ?? 0) * (countByLevel.get(level) ?? 0),
    0,
  );
  const collected = Number(paidAgg._sum.amount ?? 0);

  return c.json({
    term: { id: term.id, number: term.number },
    expected,
    collected,
    outstanding: Math.max(expected - collected, 0),
  });
});

// Split into two natural-language feeds (new students / recent payments) per
// the admin's request for separate sections instead of one merged list. Both
// read their copy from lib/event-templates so the wording matches the
// WhatsApp notifications fired for the same events.
dashboard.get("/activity", async (c) => {
  const [recentStudents, recentPayments] = await Promise.all([
    prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        fullName: true,
        level: true,
        createdAt: true,
        createdBy: { select: { username: true } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        amount: true,
        category: true,
        createdAt: true,
        student: { select: { fullName: true } },
        recordedBy: { select: { username: true } },
      },
    }),
  ]);

  return c.json({
    recentStudents: recentStudents.map((s) => ({
      id: s.id,
      type: "STUDENT_ADDED" as const,
      at: s.createdAt,
      summary: studentJoinedMessage(s.fullName, s.level),
      by: s.createdBy?.username ?? null,
    })),
    recentPayments: recentPayments.map((p) => ({
      id: p.id,
      type: "PAYMENT_RECORDED" as const,
      at: p.createdAt,
      summary: paymentMadeMessage(p.category, Number(p.amount), p.student.fullName),
      by: p.recordedBy.username,
    })),
  });
});

export default dashboard;
