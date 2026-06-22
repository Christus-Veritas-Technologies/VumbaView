import { LEVEL_LABELS, type AcademicLevelValue } from "./levels";
import type { PaymentCategory } from "@prisma/client";

/** Centralized natural-language copy for the events the admin cares about —
 * the dashboard's "New students" / "Recent payments" feeds and the WhatsApp
 * notifications both read from here, so the wording for a given event never
 * drifts between the two channels. Add a new event type by adding a function
 * here, not by hand-writing copy at the call site. */

const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  FEES: "fees",
  UNIFORMS: "uniforms",
  CUSTOM: "a custom payment",
};

export function studentJoinedMessage(fullName: string, level: AcademicLevelValue): string {
  return `A new student, ${fullName}, just joined ${LEVEL_LABELS[level]}.`;
}

export function paymentMadeMessage(category: PaymentCategory, amount: number, studentFullName: string): string {
  return `A new payment was made for ${CATEGORY_LABELS[category]} for the amount of $${amount.toFixed(2)} — ${studentFullName}.`;
}
