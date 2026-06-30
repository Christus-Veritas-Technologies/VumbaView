import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { ApiError } from "../middleware/error-handler";
import { renderHtmlToPdf } from "../lib/pdf";
import { getCurrentTerm, attachFeeStatus, type FeeStatus } from "../lib/term";
import { ACADEMIC_LEVELS } from "../lib/levels";
import { buildAllStudentsReportHtml, buildStudentsWithBalancesReportHtml } from "../lib/reports/students";
import { buildAllPaymentsReportHtml, type PaymentReportRow } from "../lib/reports/payments";
import { buildAllExpensesReportHtml, type ExpenseReportRow } from "../lib/reports/expenses";
import { buildDashboardReportHtml, type DashboardReportData } from "../lib/reports/dashboard";
import { formatDate, reportFooterTemplate } from "../lib/reports/template";
import type { AppEnv } from "../types";
import type { AcademicLevel } from "@prisma/client";
import type { Context } from "hono";

// Every report — both the per-page "Generate Report" buttons (Dashboard,
// Students, Payments admin screens, each with its own dynamic date range)
// and the dedicated Reports page's 3 fixed templates — funnels through this
// one route, sharing the same PDF builders so there's exactly one place that
// defines what "All students" or "All payments" actually contains.
const reports = new Hono<AppEnv>();

reports.use("*", requireAuth, requireRole("ADMIN"));

function pdfResponse(c: Context, pdf: Buffer, filename: string) {
  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  return c.body(new Uint8Array(pdf));
}

function rangeLabel(from?: Date, to?: Date): string | undefined {
  if (!from && !to) return undefined;
  if (from && to) return `${formatDate(from)} – ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  return `Until ${formatDate(to as Date)}`;
}

function footer(): string {
  return reportFooterTemplate(formatDate(new Date()));
}

const rangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const boundsQuerySchema = z.object({
  scope: z.enum(["students", "payments", "dashboard", "expenses"]),
});

// Drives the date-range picker's selectable bounds on every report trigger
// — never hardcoded, always the earliest/latest date actually present in
// the underlying data so the admin can't pick a range with nothing in it.
reports.get("/bounds", async (c) => {
  const parsed = boundsQuerySchema.safeParse({ scope: c.req.query("scope") });

  if (!parsed.success) {
    throw new ApiError(400, "scope must be one of students, payments, dashboard");
  }

  if (parsed.data.scope === "students") {
    const agg = await prisma.student.aggregate({ _min: { enrolledAt: true }, _max: { enrolledAt: true } });
    return c.json({ earliest: agg._min.enrolledAt, latest: agg._max.enrolledAt });
  }

  if (parsed.data.scope === "expenses") {
    const agg = await prisma.expense.aggregate({ _min: { occurredAt: true }, _max: { occurredAt: true } });
    return c.json({ earliest: agg._min.occurredAt, latest: agg._max.occurredAt });
  }

  // "payments" and "dashboard" both key off when payments happened.
  const agg = await prisma.payment.aggregate({ _min: { occurredAt: true }, _max: { occurredAt: true } });
  return c.json({ earliest: agg._min.occurredAt, latest: agg._max.occurredAt });
});

reports.get("/students", async (c) => {
  const parsed = rangeQuerySchema.safeParse({ from: c.req.query("from"), to: c.req.query("to") });

  if (!parsed.success) {
    throw new ApiError(400, "Invalid date range");
  }

  const { from, to } = parsed.data;

  const list = await prisma.student.findMany({
    where: from || to ? { enrolledAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {},
    orderBy: { fullName: "asc" },
  });

  const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true } });
  const withFees = currentTerm
    ? await attachFeeStatus(list, currentTerm.id)
    : list.map((s) => ({ ...s, fee: { feeAmount: 0, paid: 0, balance: 0, status: "UNPAID" as FeeStatus } }));

  const html = buildAllStudentsReportHtml(withFees, rangeLabel(from, to));
  const pdf = await renderHtmlToPdf(html, { footerTemplate: footer() });
  return pdfResponse(c, pdf, "all-students.pdf");
});

// Fixed template (Reports page only, no date range) — every active student
// who hasn't fully paid the current term's fees.
reports.get("/students-with-balances", async (c) => {
  const term = await getCurrentTerm();
  const list = await prisma.student.findMany({ where: { status: "ACTIVE" }, orderBy: { fullName: "asc" } });
  const withFees = await attachFeeStatus(list, term.id);

  const html = buildStudentsWithBalancesReportHtml(withFees, `Term #${term.number}`);
  const pdf = await renderHtmlToPdf(html, { footerTemplate: footer() });
  return pdfResponse(c, pdf, "students-with-balances.pdf");
});

reports.get("/payments", async (c) => {
  const parsed = rangeQuerySchema.safeParse({ from: c.req.query("from"), to: c.req.query("to") });

  if (!parsed.success) {
    throw new ApiError(400, "Invalid date range");
  }

  const { from, to } = parsed.data;

  const rows = await prisma.payment.findMany({
    where: from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {},
    orderBy: { occurredAt: "desc" },
    include: {
      student: { select: { fullName: true, admissionNo: true, level: true } },
      recordedBy: { select: { username: true } },
    },
  });

  const reportRows: PaymentReportRow[] = rows.map((p) => ({
    occurredAt: p.occurredAt,
    studentName: p.student.fullName,
    admissionNo: p.student.admissionNo,
    level: p.student.level,
    category: p.category,
    amount: Number(p.amount),
    discount: Number(p.discount),
    note: p.note,
    recordedBy: p.recordedBy.username,
  }));

  const html = buildAllPaymentsReportHtml(reportRows, rangeLabel(from, to));
  const pdf = await renderHtmlToPdf(html, { footerTemplate: footer() });
  return pdfResponse(c, pdf, "all-payments.pdf");
});

reports.get("/expenses", async (c) => {
  const parsed = rangeQuerySchema.safeParse({ from: c.req.query("from"), to: c.req.query("to") });

  if (!parsed.success) {
    throw new ApiError(400, "Invalid date range");
  }

  const { from, to } = parsed.data;

  const rows = await prisma.expense.findMany({
    where: from || to ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {},
    orderBy: { occurredAt: "desc" },
    include: { recordedBy: { select: { username: true } } },
  });

  const reportRows: ExpenseReportRow[] = rows.map((e) => ({
    occurredAt: e.occurredAt,
    category: e.category,
    amount: Number(e.amount),
    note: e.note,
    recordedBy: e.recordedBy.username,
  }));

  const html = buildAllExpensesReportHtml(reportRows, rangeLabel(from, to));
  const pdf = await renderHtmlToPdf(html, { footerTemplate: footer() });
  return pdfResponse(c, pdf, "all-expenses.pdf");
});

const dashboardRangeQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

reports.get("/dashboard", async (c) => {
  const parsed = dashboardRangeQuerySchema.safeParse({ from: c.req.query("from"), to: c.req.query("to") });

  if (!parsed.success) {
    throw new ApiError(400, "from and to query parameters are required");
  }

  const { from, to } = parsed.data;
  const occurredAt = { gte: from, lte: to };

  const [enrollmentCounts, currentTerm, periodAgg, periodCount, newStudents] = await Promise.all([
    prisma.student.groupBy({ by: ["level"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.term.findFirst({ where: { isCurrent: true } }),
    prisma.payment.aggregate({ where: { occurredAt }, _sum: { amount: true, discount: true } }),
    prisma.payment.count({ where: { occurredAt } }),
    prisma.student.count({ where: { enrolledAt: occurredAt } }),
  ]);

  const countByLevel = new Map(enrollmentCounts.map((r) => [r.level, r._count._all]));
  const byLevel = ACADEMIC_LEVELS.map((level) => ({
    level: level as AcademicLevel,
    count: countByLevel.get(level as AcademicLevel) ?? 0,
  }));
  const total = byLevel.reduce((sum, r) => sum + r.count, 0);

  let term: DashboardReportData["term"] = null;
  if (currentTerm) {
    const [feeRows, paidAgg] = await Promise.all([
      prisma.termLevelFee.findMany({ where: { termId: currentTerm.id } }),
      prisma.payment.aggregate({
        where: { termId: currentTerm.id, category: "FEES" },
        _sum: { amount: true, discount: true },
      }),
    ]);
    const feeByLevel = new Map(feeRows.map((r) => [r.level, Number(r.amount)]));
    const expected = ACADEMIC_LEVELS.reduce(
      (sum, level) => sum + (feeByLevel.get(level) ?? 0) * (countByLevel.get(level) ?? 0),
      0,
    );
    const gross = Number(paidAgg._sum.amount ?? 0);
    const discount = Number(paidAgg._sum.discount ?? 0);
    term = { number: currentTerm.number, expected, collected: gross - discount, outstanding: Math.max(expected - gross, 0) };
  }

  const gross = Number(periodAgg._sum.amount ?? 0);
  const discount = Number(periodAgg._sum.discount ?? 0);

  const html = buildDashboardReportHtml({
    enrollment: { total, byLevel },
    term,
    period: {
      fromLabel: formatDate(from),
      toLabel: formatDate(to),
      newStudents,
      payments: { count: periodCount, gross, discount, net: gross - discount },
    },
  });

  const pdf = await renderHtmlToPdf(html, { footerTemplate: footer() });
  return pdfResponse(c, pdf, "dashboard-snapshot.pdf");
});

export default reports;
