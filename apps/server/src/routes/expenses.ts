import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { ApiError } from "../middleware/error-handler";
import { BUILTIN_EXPENSE_CATEGORIES } from "../lib/constants";
import type { AppEnv } from "../types";

const expenses = new Hono<AppEnv>();

expenses.use("*", requireAuth);

const recordExpenseSchema = z.object({
  category: z.string().trim().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  note: z.string().trim().optional(),
  occurredAt: z.coerce.date().optional(),
});

// Record an expense. If the category isn't a built-in preset, upsert it into
// ExpenseCategory so it appears as a quick-pick chip next time.
expenses.post("/", requireRole("ADMIN", "RECEPTIONIST"), async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = recordExpenseSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid expense payload");
  }

  const staff = c.get("staff");

  const expense = await prisma.expense.create({
    data: {
      category: body.data.category,
      amount: body.data.amount,
      note: body.data.note,
      occurredAt: body.data.occurredAt ?? new Date(),
      recordedById: staff.id,
    },
  });

  // Upsert into ExpenseCategory so custom labels are remembered for next time.
  const isBuiltin = (BUILTIN_EXPENSE_CATEGORIES as readonly string[]).includes(body.data.category);
  if (!isBuiltin) {
    await prisma.expenseCategory.upsert({
      where: { label: body.data.category },
      create: { label: body.data.category },
      update: {},
    });
  }

  return c.json(expense, 201);
});

// Simple flat list used by the offline sync engine's pull() step.
expenses.get("/", requireRole("ADMIN", "RECEPTIONIST"), async (c) => {
  const list = await prisma.expense.findMany({
    orderBy: { occurredAt: "desc" },
    take: 100,
    include: { recordedBy: { select: { username: true } } },
  });
  return c.json(
    list.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      note: e.note,
      occurredAt: e.occurredAt,
      recordedBy: e.recordedBy.username,
    })),
  );
});

// All expense category labels: built-ins first, then any custom ones from DB.
expenses.get("/categories", requireRole("ADMIN", "RECEPTIONIST"), async (c) => {
  const custom = await prisma.expenseCategory.findMany({ orderBy: { label: "asc" } });
  const customLabels = custom.map((c) => c.label);
  // Merge: built-ins always appear; custom ones that happen to match a built-in
  // are de-duped so the list doesn't repeat.
  const all = [
    ...BUILTIN_EXPENSE_CATEGORIES,
    ...customLabels.filter((l) => !(BUILTIN_EXPENSE_CATEGORIES as readonly string[]).includes(l)),
  ];
  return c.json(all);
});

const adminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  category: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// School-wide paginated list for the admin/receptionist Expenses page.
expenses.get("/admin", requireRole("ADMIN", "RECEPTIONIST"), async (c) => {
  const parsed = adminListQuerySchema.safeParse({
    page: c.req.query("page"),
    pageSize: c.req.query("pageSize"),
    category: c.req.query("category") || undefined,
    from: c.req.query("from") || undefined,
    to: c.req.query("to") || undefined,
  });

  if (!parsed.success) {
    throw new ApiError(400, "Invalid query parameters");
  }

  const { page, pageSize, category, from, to } = parsed.data;

  const where = {
    ...(category ? { category } : {}),
    ...(from || to
      ? { occurredAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        recordedBy: { select: { username: true } },
      },
    }),
    prisma.expense.count({ where }),
  ]);

  return c.json({
    items: rows.map((e) => ({
      id: e.id,
      category: e.category,
      amount: Number(e.amount),
      note: e.note,
      occurredAt: e.occurredAt,
      recordedBy: e.recordedBy.username,
      createdAt: e.createdAt,
    })),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

export default expenses;
