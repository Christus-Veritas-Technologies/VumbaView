import { Hono } from "hono";
import { prisma } from "../db";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import type { AppEnv } from "../types";

const terms = new Hono<AppEnv>();

terms.use("*", requireAuth, requireRole("ADMIN"));

// List all terms — used by the Income Statement term picker on the
// admin Reports page so the admin can choose which term to generate the P&L for.
terms.get("/", async (c) => {
  const list = await prisma.term.findMany({
    orderBy: { number: "desc" },
    select: { id: true, number: true, isCurrent: true, startedAt: true },
  });
  return c.json(list);
});

export default terms;
