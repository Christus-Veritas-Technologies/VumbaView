import { LEVEL_LABELS } from "../levels";
import { formatDate, formatMoney, renderReportShell } from "./template";
import type { AcademicLevel, EnrollmentStatus } from "@prisma/client";

export interface StudentReportRow {
  admissionNo: number;
  fullName: string;
  level: AcademicLevel;
  status: EnrollmentStatus;
  enrolledAt: Date;
  guardianName: string | null;
  guardianPhone: string | null;
  fee: { feeAmount: number; paid: number; balance: number; status: string };
}

function statusBadge(status: string): string {
  const cls = status === "PAID" ? "badge-paid" : status === "PARTIAL" ? "badge-partial" : "badge-unpaid";
  return `<span class="badge ${cls}">${status}</span>`;
}

/** "All students" — full roster, every status, with this term's fee
 * position alongside each row so the report is useful on its own without
 * needing the balances-only report too. */
export function buildAllStudentsReportHtml(students: StudentReportRow[], rangeLabel?: string): string {
  const rows = students
    .map(
      (s) => `
    <tr>
      <td>${s.admissionNo}</td>
      <td>${escapeHtml(s.fullName)}</td>
      <td>${LEVEL_LABELS[s.level]}</td>
      <td>${s.status}</td>
      <td>${formatDate(s.enrolledAt)}</td>
      <td>${escapeHtml(s.guardianPhone ?? "—")}</td>
      <td class="num">${formatMoney(s.fee.balance)}</td>
      <td>${statusBadge(s.fee.status)}</td>
    </tr>`,
    )
    .join("");

  const activeCount = students.filter((s) => s.status === "ACTIVE").length;

  const bodyHtml = `
    <div class="summary-row">
      <div class="summary-card"><div class="label">Total students</div><div class="value">${students.length}</div></div>
      <div class="summary-card"><div class="label">Active</div><div class="value">${activeCount}</div></div>
    </div>
    <table>
      <colgroup>
        <col style="width:8%" /><col style="width:24%" /><col style="width:12%" /><col style="width:10%" />
        <col style="width:12%" /><col style="width:14%" /><col style="width:10%" /><col style="width:10%" />
      </colgroup>
      <thead>
        <tr>
          <th>Adm. No</th><th>Name</th><th>Level</th><th>Status</th>
          <th>Enrolled</th><th>Guardian phone</th><th class="num">Balance</th><th>Fee status</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="8" class="muted">No students found.</td></tr>`}</tbody>
    </table>
  `;

  return renderReportShell({ title: "All Students", subtitle: "Full student roster", rangeLabel, bodyHtml });
}

/** "Students with balances" — only students who haven't fully paid this
 * term's fees, sorted by largest balance first so the most overdue cases
 * are easiest to spot at a glance. */
export function buildStudentsWithBalancesReportHtml(
  students: StudentReportRow[],
  termLabel: string,
): string {
  const unpaid = students
    .filter((s) => s.fee.balance > 0)
    .sort((a, b) => b.fee.balance - a.fee.balance);

  const rows = unpaid
    .map(
      (s) => `
    <tr>
      <td>${s.admissionNo}</td>
      <td>${escapeHtml(s.fullName)}</td>
      <td>${LEVEL_LABELS[s.level]}</td>
      <td class="num">${formatMoney(s.fee.feeAmount)}</td>
      <td class="num">${formatMoney(s.fee.paid)}</td>
      <td class="num">${formatMoney(s.fee.balance)}</td>
      <td>${statusBadge(s.fee.status)}</td>
    </tr>`,
    )
    .join("");

  const totalOutstanding = unpaid.reduce((sum, s) => sum + s.fee.balance, 0);

  const bodyHtml = `
    <div class="summary-row">
      <div class="summary-card"><div class="label">Students with balances</div><div class="value">${unpaid.length}</div></div>
      <div class="summary-card"><div class="label">Total outstanding</div><div class="value">${formatMoney(totalOutstanding)}</div></div>
    </div>
    <table>
      <colgroup>
        <col style="width:9%" /><col style="width:27%" /><col style="width:14%" />
        <col style="width:13%" /><col style="width:13%" /><col style="width:13%" /><col style="width:11%" />
      </colgroup>
      <thead>
        <tr>
          <th>Adm. No</th><th>Name</th><th>Level</th>
          <th class="num">Fee</th><th class="num">Paid</th><th class="num">Balance</th><th>Status</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="7" class="muted">Everyone has paid in full this term.</td></tr>`}</tbody>
    </table>
  `;

  return renderReportShell({
    title: "Students With Balances",
    subtitle: `Unpaid or partially paid — ${termLabel}`,
    bodyHtml,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
