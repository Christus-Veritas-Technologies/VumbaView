import { prisma } from "../db";
import { ApiError } from "../middleware/error-handler";
import type { AcademicLevel } from "@prisma/client";

/** The term that's active right now, resolved server-side. Routes should
 * always call this rather than trust a termId from the client — that's what
 * makes a payment synced after an offline term rollover land in the term
 * that's actually current on the server. */
export async function getCurrentTerm() {
  const term = await prisma.term.findFirst({ where: { isCurrent: true } });

  if (!term) {
    throw new ApiError(500, "No current term set up yet — start one from Admin Settings");
  }

  return term;
}

export type FeeStatus = "PAID" | "PARTIAL" | "UNPAID";

export function deriveFeeStatus(feeAmount: number, paid: number): { balance: number; status: FeeStatus } {
  const balance = feeAmount - paid;

  if (feeAmount > 0 && paid <= 0) {
    return { balance, status: "UNPAID" };
  }

  return { balance, status: balance <= 0 ? "PAID" : "PARTIAL" };
}

type FeeInfo = { feeAmount: number; paid: number; balance: number; status: FeeStatus };

/** Bulk-attaches fee info for a list of students in one term — two queries
 * total, not one-per-student. */
export async function attachFeeStatus<T extends { id: string; level: AcademicLevel }>(
  students: T[],
  termId: string,
): Promise<(T & { fee: FeeInfo })[]> {
  if (students.length === 0) {
    return [];
  }

  const [feeRows, paidRows] = await Promise.all([
    prisma.termLevelFee.findMany({ where: { termId } }),
    prisma.payment.groupBy({
      by: ["studentId"],
      where: { termId, category: "FEES", studentId: { in: students.map((s) => s.id) } },
      _sum: { amount: true },
    }),
  ]);

  const feeByLevel = new Map(feeRows.map((r) => [r.level, Number(r.amount)]));
  const paidByStudent = new Map(paidRows.map((r) => [r.studentId, Number(r._sum.amount ?? 0)]));

  return students.map((s) => {
    const feeAmount = feeByLevel.get(s.level) ?? 0;
    const paid = paidByStudent.get(s.id) ?? 0;
    const { balance, status } = deriveFeeStatus(feeAmount, paid);
    return { ...s, fee: { feeAmount, paid, balance, status } };
  });
}
