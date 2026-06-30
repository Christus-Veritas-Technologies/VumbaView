export const ENROLLMENT_STATUSES = ["ACTIVE", "WITHDRAWN", "GRADUATED"] as const;
export const PAYMENT_CATEGORIES = ["FEES", "UNIFORMS", "CUSTOM"] as const;
export const STAFF_ROLES = ["ADMIN", "RECEPTIONIST"] as const;

/** Default expense categories always available without a custom entry. */
export const BUILTIN_EXPENSE_CATEGORIES = [
  "Payroll",
  "Fuel",
  "Utilities",
  "Maintenance",
  "Supplies",
  "Rent",
  "Other",
] as const;

/** The seeded root admin account (prisma/seed-admin.ts). Single source of
 * truth for "is this the root admin" checks — e.g. the deactivate route uses
 * this to refuse deactivating it, regardless of who's asking. */
export const ROOT_ADMIN_USERNAME = "stephen";
