// Mirrors apps/server's AcademicLevel Prisma enum (apps/server/src/lib/levels.ts).
// apps/web can't import server code directly, so this list is duplicated here —
// same convention apps/reception uses in lib/types.ts. Keep all three in sync.
export type AcademicLevel =
  | "ECD_A"
  | "ECD_B"
  | "GRADE_1"
  | "GRADE_2"
  | "GRADE_3"
  | "GRADE_4"
  | "GRADE_5"
  | "GRADE_6"
  | "GRADE_7"
  | "FORM_1"
  | "FORM_2"
  | "FORM_3"
  | "FORM_4"
  | "FORM_5"
  | "FORM_6";

export const ACADEMIC_LEVELS: AcademicLevel[] = [
  "ECD_A",
  "ECD_B",
  "GRADE_1",
  "GRADE_2",
  "GRADE_3",
  "GRADE_4",
  "GRADE_5",
  "GRADE_6",
  "GRADE_7",
  "FORM_1",
  "FORM_2",
  "FORM_3",
  "FORM_4",
  "FORM_5",
  "FORM_6",
];

export const LEVEL_LABELS: Record<AcademicLevel, string> = {
  ECD_A: "ECD A",
  ECD_B: "ECD B",
  GRADE_1: "Grade 1",
  GRADE_2: "Grade 2",
  GRADE_3: "Grade 3",
  GRADE_4: "Grade 4",
  GRADE_5: "Grade 5",
  GRADE_6: "Grade 6",
  GRADE_7: "Grade 7",
  FORM_1: "Form 1",
  FORM_2: "Form 2",
  FORM_3: "Form 3",
  FORM_4: "Form 4",
  FORM_5: "Form 5",
  FORM_6: "Form 6",
};
