// Shared, plain-English field validators for every form in this app.
//
// The rule: never surface a raw type word ("string", "undefined", "NaN") to
// a receptionist or admin. Every message here names the field and says
// what's wrong in plain terms — "X is empty, please enter it." or "X looks
// like text, please make it a number." This matters most here because the
// reception app is offline-first: a bad value can get queued for sync and
// only fail much later, far from the screen where it was typed. Catching it
// at entry time, with a message a non-technical receptionist can act on, is
// the whole point.

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

/** Required free-text field (name, username, ...). */
export function requiredText(value: string, label: string): string | undefined {
  return isBlank(value) ? `${label} is empty, please enter it.` : undefined;
}

/** Required free-text field with a minimum length (e.g. a password). */
export function minLength(value: string, label: string, min: number): string | undefined {
  if (isBlank(value)) return `${label} is empty, please enter it.`;
  return value.trim().length < min ? `${label} must be at least ${min} characters.` : undefined;
}

/** Required numeric field typed as text (amounts, fees). */
export function requiredAmount(value: string, label: string): string | undefined {
  if (isBlank(value)) return `${label} is empty, please enter it.`;
  return Number.isFinite(Number(value.trim())) ? undefined : `${label} looks like text, please make it a number.`;
}

/**
 * Numeric field typed as text that's allowed to be left blank (treated as
 * 0 by the caller) — e.g. an unset fee for one academic level.
 */
export function optionalAmount(value: string, label: string): string | undefined {
  if (isBlank(value)) return undefined;
  const n = Number(value.trim());
  if (!Number.isFinite(n)) return `${label} looks like text, please make it a number.`;
  return n < 0 ? `${label} can't be negative.` : undefined;
}

const PHONE_RE = /^[+0-9][0-9\s\-()]{5,}$/;

/** Optional phone field — only checked once something's been typed. */
export function optionalPhone(value: string, label: string): string | undefined {
  if (isBlank(value)) return undefined;
  return PHONE_RE.test(value.trim()) ? undefined : `${label} doesn't look like a valid phone number.`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Optional email field — only checked once something's been typed. */
export function optionalEmail(value: string, label: string): string | undefined {
  if (isBlank(value)) return undefined;
  return EMAIL_RE.test(value.trim()) ? undefined : `${label} doesn't look like a valid email address.`;
}
