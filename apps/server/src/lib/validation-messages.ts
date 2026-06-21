// Plain-English request-validation messages for public, unauthenticated
// endpoints (/contact, /admissions).
//
// Why this exists: these routes parse the request body with zod, and zod's
// own messages ("Invalid input: expected string, received undefined") are
// meant for API developers, not the visitor who'll see them in a toast.
// Checking the raw JSON ourselves first — before it ever reaches zod — lets
// us name the exact field and say what's wrong in plain terms. Any failure
// zod still catches on its own (an unexpected shape we didn't anticipate)
// falls back to GENERIC_INVALID_MESSAGE, so a raw zod message can never
// reach the client either way — including from a stale/old client sending
// a shape this code no longer expects.

export interface FieldSpec {
  key: string;
  label: string;
}

export const GENERIC_INVALID_MESSAGE = "Please check your information and try again.";

/**
 * Checks the raw, pre-zod request body for missing/empty required string
 * fields. Returns the first problem found as a friendly message, or null if
 * everything listed is present.
 */
export function findMissingField(json: unknown, fields: FieldSpec[]): string | null {
  if (!json || typeof json !== "object") {
    return "Couldn't read your submission, please try again.";
  }

  const record = json as Record<string, unknown>;
  for (const { key, label } of fields) {
    const value = record[key];
    if (value === undefined || value === null) {
      return `${label} is empty, please enter it.`;
    }
    if (typeof value === "string" && value.trim() === "") {
      return `${label} is empty, please enter it.`;
    }
    if (typeof value !== "string") {
      return `${label} looks like a number, please enter text.`;
    }
  }
  return null;
}
