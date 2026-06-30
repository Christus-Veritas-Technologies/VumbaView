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
import { buildProfitLossReportHtml } from "../lib/reports/profit-loss";
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

// Income Statement (P&L) — scoped to a single term.
// Revenue = net payments (amount - discount) for the term, grouped by category/customLabel.
// Expenditure = expenses whose occurredAt falls within the term's date range.
reports.get("/profit-loss", async (c) => {
  const termId = c.req.query("termId");
  if (!termId) throw new ApiError(400, "termId query parameter is required");

  const term = await prisma.term.findUnique({
    where: { id: termId },
    select: { id: true, number: true, isCurrent: true, startedAt: true },
  });
  if (!term) throw new ApiError(404, "Term not found");

  // Expense range: this term's start → next term's start (or now for current).
  const nextTerm = await prisma.term.findFirst({
    where: { number: { gt: term.number } },
    orderBy: { number: "asc" },
    select: { startedAt: true },
  });
  const expenseEnd = nextTerm ? nextTerm.startedAt : new Date();

  const [payments, expenses] = await Promise.all([
    prisma.payment.findMany({
      where: { termId },
      select: { category: true, customLabel: true, amount: true, discount: true },
    }),
    prisma.expense.findMany({
      where: { occurredAt: { gte: term.startedAt, lt: expenseEnd } },
      select: { category: true, amount: true },
    }),
  ]);

  // Aggregate revenue by display label.
  const CATEGORY_LABELS: Record<string, string> = {
    FEES: "Tuition Fees",
    UNIFORMS: "Uniform Sales",
    CUSTOM: "Other Income",
  };
  const revenueMap = new Map<string, number>();
  for (const p of payments) {
    const label =
      p.category === "CUSTOM" && p.customLabel
        ? p.customLabel
        : (CATEGORY_LABELS[p.category] ?? p.category);
    const net = Number(p.amount) - Number(p.discount);
    revenueMap.set(label, (revenueMap.get(label) ?? 0) + net);
  }

  // Aggregate expenditure by category.
  const expenseMap = new Map<string, number>();
  for (const e of expenses) {
    expenseMap.set(e.category, (expenseMap.get(e.category) ?? 0) + Number(e.amount));
  }

  const html = buildProfitLossReportHtml({
    termNumber: term.number,
    termStartedAt: term.startedAt,
    termEndedAt: expenseEnd,
    isCurrent: term.isCurrent,
    revenueLines: [...revenueMap.entries()].map(([label, amount]) => ({ label, amount })),
    expenseLines: [...expenseMap.entries()].map(([label, amount]) => ({ label, amount })),
  });

  const pdf = await renderHtmlToPdf(html, { footerTemplate: footer() });
  return pdfResponse(c, pdf, `income-statement-term${term.number}.pdf`);
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
