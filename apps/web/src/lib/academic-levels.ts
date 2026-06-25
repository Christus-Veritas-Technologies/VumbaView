// Mirrors apps/server's AcademicLevel Prisma enum (apps/server/src/lib/levels.ts).
// apps/web can't import server code directly, so this list is duplicated here —
// same convention apps/reception uses in lib/types.ts. Keep all three in sync.
// Form 1 to Form 6 only — VumbaView is a secondary day school, no ECD/Primary.
export type AcademicLevel =
  | "FORM_1"
  | "FORM_2"
  | "FORM_3"
  | "FORM_4"
  | "FORM_5"
  | "FORM_6";

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  "FORM_1",
  "FORM_2",
  "FORM_3",
  "FORM_4",
  "FORM_5",
  "FORM_6",
];

export const LEVEL_LABELS: Record<AcademicLevel, string> = {
  FORM_1: "Form 1",
  FORM_2: "Form 2",
  FORM_3: "Form 3",
  FORM_4: "Form 4",
  FORM_5: "Form 5",
  FORM_6: "Form 6",
};
