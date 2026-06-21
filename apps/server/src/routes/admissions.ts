import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../db";
import { ApiError } from "../middleware/error-handler";
import { rateLimit } from "../middleware/rate-limit";
import { notifyInquiryCreated } from "../lib/whatsapp";
import { ACADEMIC_LEVELS } from "../lib/levels";
import { findMissingField, GENERIC_INVALID_MESSAGE } from "../lib/validation-messages";
import type { AcademicLevel, InquiryType } from "@prisma/client";

// Public — prospective families submit this from the marketing site (the
// admissions page form or the navbar dialog) with no staff login, so this
// router intentionally does NOT use requireAuth. Staff-facing list/detail/
// status-update endpoints for triaging these in the reception/admin app are
// deliberately not built yet — this is just the public intake side.
//
// Being public/no-auth also means it's open to bots, so it gets two cheap
// defenses: a rate limit, and a `website` honeypot field the real form never
// shows or fills — if it's non-empty, silently no-op with a fake 201 instead
// of revealing the check to whatever filled it in.
const admissions = new Hono();

admissions.use("*", rateLimit({ max: 5, windowMs: 10 * 60 * 1000 }));

const inquiryInput = z.object({
  parentName: z.string().min(1),
  phone: z.string().min(1),
  childName: z.string().min(1),
  level: z.enum(ACADEMIC_LEVELS),
  message: z.string().trim().min(1).optional(),
  website: z.string().optional(),
  type: z.enum(["APPLICATION", "TOUR_REQUEST"]).default("APPLICATION"),
});

admissions.post("/", async (c) => {
  const json = await c.req.json().catch(() => null);

  // Plain-English check first — see contact.ts for why: it stops a stale or
  // malformed client from ever surfacing zod's raw "expected string,
  // received undefined" wording to the end user.
  const missing = findMissingField(json, [
    { key: "parentName", label: "Parent / guardian name" },
    { key: "phone", label: "Phone number" },
    { key: "childName", label: "Child's name" },
  ]);
  if (missing) throw new ApiError(400, missing);

  const record = json as Record<string, unknown>;
  if (!record.level || typeof record.level !== "string") {
    throw new ApiError(400, "Academic level is empty, please select one.");
  }

  const body = inquiryInput.safeParse(json);
  if (!body.success) {
    throw new ApiError(400, GENERIC_INVALID_MESSAGE);
  }

  const { website, ...data } = body.data;
  if (website) {
    return c.json({ ok: true }, 201);
  }

  const inquiry = await prisma.inquiry.create({
    data: {
      ...data,
      level: data.level as AcademicLevel,
      type: data.type as InquiryType,
    },
  });

  // Covers both APPLICATION and TOUR_REQUEST — both are the same admissions
  // funnel (see the model comment in schema.prisma), and the admin wants
  // visibility into either. Fire-and-forget, same reasoning as payments.ts.
  void notifyInquiryCreated(inquiry);

  return c.json(inquiry, 201);
});

export default admissions;
