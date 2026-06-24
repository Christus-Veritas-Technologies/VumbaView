import { Hono } from "hono";
import { prisma } from "../db";
import { ApiError } from "../middleware/error-handler";
import { rateLimit } from "../middleware/rate-limit";

// Public — this is what the QR code printed on a receipt points at (see
// apps/reception/lib/printer.ts), so anyone who scans it needs to be able to
// load it with no staff login. Rate limited rather than authenticated, since
// legitimate traffic is any parent's phone, off the school's network,
// potentially refreshing the page more than once.
//
// Deliberately returns a minimal public shape — only what's already printed
// on the physical receipt (amount, student name, level, admission number,
// category, date). No guardian contact details, running fee balance, or
// recording staff member — none of that is needed to prove a receipt is
// genuine, and all of it is more sensitive than what's already on the paper.
const verify = new Hono();

verify.use("*", rateLimit({ max: 30, windowMs: 10 * 60 * 1000 }));

verify.get("/:id", async (c) => {
  const id = c.req.param("id");

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      student: { select: { fullName: true, admissionNo: true, level: true } },
    },
  });

  if (!payment) {
    throw new ApiError(404, "We couldn't find a payment matching this receipt. The QR code may be invalid.");
  }

  const amount = Number(payment.amount);
  const discount = Number(payment.discount);

  return c.json({
    verified: true,
    schoolName: "VumbaView Academy",
    receiptId: payment.id,
    occurredAt: payment.occurredAt,
    category: payment.category,
    amount,
    discount,
    netAmount: amount - discount,
    studentName: payment.student.fullName,
    admissionNo: payment.student.admissionNo,
    level: payment.student.level,
  });
});

export default verify;
