import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { ApiError } from "../middleware/error-handler";
import { rateLimit } from "../middleware/rate-limit";

// Public — same shape as admissions.ts: no auth (general site visitors send
// these), so it gets the same rate limit + honeypot defenses.
const contact = new Hono();

contact.use("*", rateLimit({ max: 5, windowMs: 10 * 60 * 1000 }));

const contactInput = z.object({
  name: z.string().min(1),
  email: z.email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  website: z.string().optional(),
});

contact.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);
  const body = contactInput.safeParse(json);

  if (!body.success) {
    throw new ApiError(400, body.error.issues[0]?.message ?? "Invalid message payload");
  }

  const { website, ...data } = body.data;
  if (website) {
    return c.json({ ok: true }, 201);
  }

  const message = await prisma.contactMessage.create({ data });

  return c.json(message, 201);
});

export default contact;
