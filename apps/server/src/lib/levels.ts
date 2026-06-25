// Mirrors apps/web's academicLevels stages (O-Level -> A-Level, Form 1 to Form 6 only).
export const ACADEMIC_LEVELS = [
  "FORM_1",
  "FORM_2",
  "FORM_3",
  "FORM_4",
  "FORM_5",
  "FORM_6",
] as const;

export type AcademicLevelValue = (typeof ACADEMIC_LEVELS)[number];

export const LEVEL_LABELS: Record<AcademicLevelValue, string> = {
  FORM_1: "Form 1",
  FORM_2: "Form 2",
  FORM_3: "Form 3",
  FORM_4: "Form 4",
  FORM_5: "Form 5",
  FORM_6: "Form 6",
};
