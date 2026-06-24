export type StaffRole = "ADMIN" | "RECEPTIONIST";

// Mirrors apps/server/src/lib/constants.ts's ROOT_ADMIN_USERNAME — kept in
// sync by hand. Used to hide/disable the Deactivate action for this account
// in the UI (the server also refuses the request either way).
export const ROOT_ADMIN_USERNAME = "stephen";

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

// Mirrors apps/server/src/lib/levels.ts — kept in sync by hand since the
// client can't import server code directly.
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

export type EnrollmentStatus = "ACTIVE" | "WITHDRAWN" | "GRADUATED";
export const ENROLLMENT_STATUSES: EnrollmentStatus[] = ["ACTIVE", "WITHDRAWN", "GRADUATED"];

export type PaymentCategory = "FEES" | "UNIFORMS" | "CUSTOM";
export const PAYMENT_CATEGORIES: PaymentCategory[] = ["FEES", "UNIFORMS", "CUSTOM"];

export type FeeStatus = "PAID" | "PARTIAL" | "UNPAID";

export interface Staff {
  id: string;
  username: string;
  role: StaffRole;
  active?: boolean;
  createdAt?: string;
}

export interface FeeInfo {
  feeAmount: number;
  paid: number;
  balance: number;
  status: FeeStatus;
}

export interface Student {
  id: string;
  fullName: string;
  level: AcademicLevel;
  status: EnrollmentStatus;
  dateOfBirth: string | null;
  photoUrl: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
  guardianAddress: string | null;
  admissionNo: number;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  fee?: FeeInfo;
}

export interface Payment {
  id: string;
  studentId: string;
  category: PaymentCategory;
  amount: number | string;
  // Net cash, full credit: the student's balance is always credited the
  // full `amount`; `discount` (default 0) is only ever subtracted when
  // tallying cash actually collected (dashboard/report totals).
  discount: number | string;
  note: string | null;
  occurredAt: string;
  termId: string;
  recordedById: string;
  createdAt: string;
}

export interface LevelFee {
  level: AcademicLevel;
  amount: number;
}

export interface DashboardEnrollment {
  total: number;
  byLevel: { level: AcademicLevel; count: number }[];
}

export interface DashboardFees {
  term: { id: string; number: number };
  expected: number;
  collected: number;
  outstanding: number;
}

export interface ActivityItem {
  type: "STUDENT_ADDED" | "PAYMENT_RECORDED" | "INQUIRY_RECEIVED";
  at: string;
  summary: string;
  by: string | null;
}
