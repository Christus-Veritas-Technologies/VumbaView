// Mirrors apps/web's academicLevels stages (ECD -> Primary -> O-Level -> A-Level).
export const ACADEMIC_LEVELS = [
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
] as const;

export type AcademicLevelValue = (typeof ACADEMIC_LEVELS)[number];

export const LEVEL_LABELS: Record<AcademicLevelValue, string> = {
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
