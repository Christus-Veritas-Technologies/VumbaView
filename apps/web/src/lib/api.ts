import { env } from "@vva/env/web";

export type InquiryPayload = {
  parentName: string;
  email: string;
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
  email: string;
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
