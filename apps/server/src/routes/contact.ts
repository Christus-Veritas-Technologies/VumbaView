import { Hono } from "hono";
import { z } from "zod";
import { ApiError } from "../middleware/error-handler";
import { rateLimit } from "../middleware/rate-limit";
import { notifyContactMessage } from "../lib/whatsapp";
import { findMissingField, GENERIC_INVALID_MESSAGE } from "../lib/validation-messages";

// Public — same shape as admissions.ts: no auth (general site visitors send
// these), so it gets the same rate limit + honeypot defenses.
//
// Contact messages are intentionally NOT persisted to the database — there's
// no admin inbox/triage view for them, so a stored row would just sit there
// unseen. Instead this forwards straight to the admin's WhatsApp (see
// notifyContactMessage), the same channel payments/inquiries already notify
// on. If that ever needs a stored record again, reintroduce a ContactMessage
// model + create() call here.
const contact = new Hono();

contact.use("*", rateLimit({ max: 5, windowMs: 10 * 60 * 1000 }));

const contactInput = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
  website: z.string().optional(),
});

contact.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);

  // Checked first, in plain English, so a stale or malformed client (e.g.
  // one still sending a since-removed field) never surfaces zod's raw
  // "expected string, received undefined" wording to the end user.
  const missing = findMissingField(json, [
    { key: "name", label: "Name" },
    { key: "phone", label: "Phone number" },
    { key: "subject", label: "Subject" },
    { key: "message", label: "Message" },
  ]);
  if (missing) throw new ApiError(400, missing);

  const body = contactInput.safeParse(json);
  if (!body.success) {
    throw new ApiError(400, GENERIC_INVALID_MESSAGE);
  }

  const { website, ...data } = body.data;
  if (website) {
    return c.json({ ok: true }, 201);
  }

  // Fire-and-forget, same reasoning as payments.ts/admissions.ts — there's no
  // database write here to await in the first place.
  void notifyContactMessage(data);

  return c.json({ ok: true }, 201);
});

export default contact;
