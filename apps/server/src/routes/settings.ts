import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { ApiError } from "../middleware/error-handler";
import { ACADEMIC_LEVELS } from "../lib/levels";
import type { AppEnv } from "../types";
import type { AcademicLevel } from "@prisma/client";

const settings = new Hono<AppEnv>();

settings.use("*", requireAuth, requireRole("ADMIN"));

settings.get("/fees", async (c) => {
  const rows = await prisma.levelFeeSetting.findMany();
  const byLevel = new Map(rows.map((r) => [r.level, Number(r.amount)]));

  const fees = ACADEMIC_LEVELS.map((level) => ({ level, amount: byLevel.get(level) ?? 0 }));

  return c.json(fees);
});

const setFeesSchema = z.object({
  fees: z.array(
    z.object({
      level: z.enum(ACADEMIC_LEVELS),
      amount: z.number().min(0),
    }),
  ),
});

settings.put("/fees", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = setFeesSchema.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, "Invalid fee payload");
  }

  // Editing the live fee schedule takes effect immediately for the term
  // that's currently open — every active student in that level sees their
  // outstanding balance change right away, not just on the next "Start New
  // Term". Past/closed terms are untouched: their TermLevelFee rows belong
  // to a different termId and this only ever updates the current one.
  const currentTerm = await prisma.term.findFirst({ where: { isCurrent: true } });

  await prisma.$transaction([
    ...body.data.fees.map((f) =>
      prisma.levelFeeSetting.upsert({
        where: { level: f.level as AcademicLevel },
        update: { amount: f.amount },
        create: { level: f.level as AcademicLevel, amount: f.amount },
      }),
    ),
    ...(currentTerm
      ? body.data.fees.map((f) =>
          prisma.termLevelFee.upsert({
            where: { termId_level: { termId: currentTerm.id, level: f.level as AcademicLevel } },
            update: { amount: f.amount },
            create: { termId: currentTerm.id, level: f.level as AcademicLevel, amount: f.amount },
          }),
        )
      : []),
  ]);

  const rows = await prisma.levelFeeSetting.findMany();
  const byLevel = new Map(rows.map((r) => [r.level, Number(r.amount)]));
  const fees = ACADEMIC_LEVELS.map((level) => ({ level, amount: byLevel.get(level) ?? 0 }));

  return c.json(fees);
});

// "Start New Term" — immediately resets every student's term balance by
// pointing the app at a new Term, snapshotting the current live fee
// settings so changing fees later never rewrites history.
settings.post("/start-term", async (c) => {
  const current = await prisma.term.findFirst({ where: { isCurrent: true } });
  const nextNumber = current ? current.number + 1 : 1;

  const liveFees = await prisma.levelFeeSetting.findMany();
  const liveByLevel = new Map(liveFees.map((r) => [r.level, r.amount]));

  const term = await prisma.$transaction(async (tx) => {
    if (current) {
      await tx.term.update({ where: { id: current.id }, data: { isCurrent: false } });
    }

    const created = await tx.term.create({
      data: { number: nextNumber, isCurrent: true },
    });

    await tx.termLevelFee.createMany({
      data: ACADEMIC_LEVELS.map((level) => ({
        termId: created.id,
        level: level as AcademicLevel,
        amount: liveByLevel.get(level) ?? 0,
      })),
    });

    return created;
  });

  return c.json(term, 201);
});

export default settings;
