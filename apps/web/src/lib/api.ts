import { env } from "@vva/env/web";

export type InquiryPayload = {
  parentName: string;
  phone: string;
  childName: string;
  level: string;
  message?: string;
  /** Honeypot — always sent empty by the real form. Non-empty means a bot filled it. */
  website?: string;
  /** Defaults to "APPLICATION" server-side if omitted. */
  type?: "APPLICATION" | "TOUR_REQUEST";
};

/** Posts a new admissions inquiry to apps/server. Public endpoint — no auth. */
export async function submitInquiry(payload: InquiryPayload) {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/admissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }

  return response.json();
}

export type ContactMessagePayload = {
  name: string;
  phone: string;
  subject: string;
  message: string;
  /** Honeypot — always sent empty by the real form. Non-empty means a bot filled it. */
  website?: string;
};

/** Posts a new contact message to apps/server. Public endpoint — no auth. */
export async function submitContactMessage(payload: ContactMessagePayload) {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "Something went wrong. Please try again.");
  }

  return response.json();
}

export type PaymentVerification = {
  verified: true;
  schoolName: string;
  receiptId: string;
  occurredAt: string;
  category: string;
  amount: number;
  discount: number;
  netAmount: number;
  studentName: string;
  admissionNo: number;
  level: string;
};

export type VerifyResult =
  | { ok: true; data: PaymentVerification }
  | { ok: false; status: number; message: string };

/**
 * Looks up a payment by receipt ID — what a receipt's printed QR code links
 * to (see apps/reception/lib/printer.ts and apps/server/src/routes/verify.ts).
 * Public endpoint, no auth. Returns a result object rather than throwing so
 * the /verify/[id] page can render a distinct "not found" state instead of
 * a generic error boundary.
 */
export async function verifyPayment(id: string): Promise<VerifyResult> {
  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/verify/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    return {
      ok: false,
      status: response.status,
      message: body?.error ?? "Something went wrong. Please try again.",
    };
  }

  return { ok: true, data: await response.json() };
}
