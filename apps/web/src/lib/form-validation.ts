// Small, shared field validators for the marketing site's public forms
// (Contact, Admissions/Inquiry). Every message is plain English — no raw
// type words like "string" or "undefined" — so a confusing validation
// failure never reaches a visitor, whether it's caught here on submit or
// echoed back from the server as a last resort.

export function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

const PHONE_RE = /^[+0-9][0-9\s\-()]{5,}$/;

/** Required phone field: checks both that it's present and that it looks
 * like a phone number, not just any non-empty text. */
export function validatePhone(value: string, label = "Phone number"): string | undefined {
  if (isBlank(value)) return `Please enter ${label.toLowerCase()}.`;
  return PHONE_RE.test(value.trim())
    ? undefined
    : `${label} doesn't look like a valid phone number — please use digits only.`;
}
