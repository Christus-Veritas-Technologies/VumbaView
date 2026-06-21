import { Client, LocalAuth } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import puppeteer from "puppeteer";
import { env } from "@vva/env/server";
import type { Inquiry, Payment, Student } from "@prisma/client";

/// Sends the admin a WhatsApp message whenever a payment is recorded or an
/// admissions inquiry comes in. Runs a real, automated WhatsApp Web session
/// (via whatsapp-web.js + a headless Chromium driven by puppeteer) — not the
/// official WhatsApp Business API. The first time this starts, it needs the
/// admin to scan a QR code (printed to the server logs) from WhatsApp's
/// Linked Devices screen; after that, LocalAuth persists the session to disk
/// so restarts don't need a re-scan, as long as that directory survives
/// restarts (a mounted volume in prod — see README).
//
// CHROMIUM_URL lets ops point this at a specific Chromium/Chrome binary
// instead of whatever puppeteer downloaded for itself. It's optional: when
// unset, puppeteer.executablePath() resolves wherever its own postinstall
// step put Chromium, which is correct both locally and in the Docker image.
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: ".wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    executablePath: env.CHROMIUM_URL || puppeteer.executablePath(),
    // Required on headless Linux containers, doubly so since this Dockerfile
    // runs as root (no USER step) and Chromium refuses to run sandboxed as
    // root by default.
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  },
});

let ready = false;
let initPromise: Promise<void> | null = null;

client.on("qr", (qr) => {
  console.log("[whatsapp] Scan this QR code from the admin's WhatsApp (Linked Devices > Link a Device):");
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("[whatsapp] Authenticated.");
});

client.on("ready", () => {
  ready = true;
  console.log("[whatsapp] Client ready — admin notifications are live.");
});

client.on("auth_failure", (message) => {
  ready = false;
  console.error("[whatsapp] Authentication failure:", message);
});

client.on("disconnected", (reason) => {
  ready = false;
  console.error("[whatsapp] Disconnected:", reason);
});

/// Starts the client. Safe to call multiple times — subsequent calls return
/// the same in-flight/settled promise rather than launching a second browser.
/// Call this once at boot and don't await it from the request path; a
/// WhatsApp outage or a not-yet-scanned QR code should never block the API
/// from serving requests.
export function initWhatsApp(): Promise<void> {
  if (!initPromise) {
    initPromise = client.initialize().catch((err) => {
      console.error("[whatsapp] Failed to initialize:", err);
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

function toChatId(phone: string): string {
  return `${phone.replace(/[^0-9]/g, "")}@c.us`;
}

/// Fire-and-forget send to the admin's number. Swallows its own errors (logs
/// instead) so a WhatsApp problem never turns into a failed payment/inquiry
/// request — those already succeeded against the database by the time this
/// is called.
async function sendAdminWhatsApp(message: string): Promise<void> {
  if (!env.ADMIN_WHATSAPP_NUMBER) {
    return;
  }

  if (!ready) {
    console.warn("[whatsapp] Client not ready yet, dropping notification:", message.split("\n")[0]);
    return;
  }

  try {
    await client.sendMessage(toChatId(env.ADMIN_WHATSAPP_NUMBER), message);
  } catch (err) {
    console.error("[whatsapp] Failed to send admin notification:", err);
  }
}

export function notifyPaymentRecorded(payment: Payment, student: Student, recordedByUsername: string): Promise<void> {
  const message = [
    "💰 New payment recorded",
    "",
    `Student: ${student.fullName} (#${student.admissionNo})`,
    `Category: ${payment.category}`,
    `Amount: $${Number(payment.amount).toFixed(2)}`,
    payment.note ? `Note: ${payment.note}` : null,
    `Recorded by: ${recordedByUsername}`,
    `Date: ${payment.occurredAt.toLocaleString("en-ZW", { timeZone: "Africa/Harare" })}`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return sendAdminWhatsApp(message);
}

export function notifyInquiryCreated(inquiry: Inquiry): Promise<void> {
  const label = inquiry.type === "TOUR_REQUEST" ? "New tour request" : "New admissions application";

  const message = [
    `🎓 ${label}`,
    "",
    `Parent: ${inquiry.parentName}`,
    `Child: ${inquiry.childName} (${inquiry.level.replace(/_/g, " ")})`,
    `Phone: ${inquiry.phone}`,
    inquiry.message ? `Message: ${inquiry.message}` : null,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return sendAdminWhatsApp(message);
}

/// Contact-page messages aren't persisted to the database (see contact.ts) —
/// this WhatsApp message IS the record. No Inquiry/Payment-style Prisma model
/// backs it, hence the inline type instead of importing one from
/// @prisma/client.
export function notifyContactMessage(data: {
  name: string;
  phone: string;
  subject: string;
  message: string;
}): Promise<void> {
  const message = [
    "✉️ New contact message",
    "",
    `Name: ${data.name}`,
    `Phone: ${data.phone}`,
    `Subject: ${data.subject}`,
    `Message: ${data.message}`,
  ].join("\n");

  return sendAdminWhatsApp(message);
}
