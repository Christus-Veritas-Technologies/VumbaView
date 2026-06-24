import { LEVEL_LABELS } from "../levels";
import { formatMoney, renderReportShell } from "./template";
import type { AcademicLevel } from "@prisma/client";

export interface DashboardReportData {
  enrollment: { total: number; byLevel: { level: AcademicLevel; count: number }[] };
  term: { number: number; expected: number; collected: number; outstanding: number } | null;
  period: {
    fromLabel: string;
    toLabel: string;
    newStudents: number;
    payments: { count: number; gross: number; discount: number; net: number };
  };
}

/** The Dashboard page's own "Generate Report" export — a one-page snapshot
 * of enrollment + this term's fee position + however the admin's chosen
 * date range performed, so it reads as a standalone summary rather than a
 * dump of every table on the screen. */
export function buildDashboardReportHtml(data: DashboardReportData): string {
  const enrollmentRows = data.enrollment.byLevel
    .filter((row) => row.count > 0)
    .map((row) => `<tr><td>${LEVEL_LABELS[row.level]}</td><td class="num">${row.count}</td></tr>`)
    .join("");

  const termSection = data.term
    ? `
    <div class="summary-row">
      <div class="summary-card"><div class="label">Term</div><div class="value">#${data.term.number}</div></div>
      <div class="summary-card"><div class="label">Expected</div><div class="value">${formatMoney(data.term.expected)}</div></div>
      <div class="summary-card"><div class="label">Collected (net)</div><div class="value">${formatMoney(data.term.collected)}</div></div>
      <div class="summary-card"><div class="label">Outstanding</div><div class="value">${formatMoney(data.term.outstanding)}</div></div>
    </div>`
    : `<p class="muted">No term has been started yet.</p>`;

  const bodyHtml = `
    <h2 style="font-family:'Plus Jakarta Sans'; font-size:12pt; margin:0 0 10px;">Current term</h2>
    ${termSection}

    <h2 style="font-family:'Plus Jakarta Sans'; font-size:12pt; margin:22px 0 10px;">${data.period.fromLabel} – ${data.period.toLabel}</h2>
    <div class="summary-row">
      <div class="summary-card"><div class="label">New students</div><div class="value">${data.period.newStudents}</div></div>
      <div class="summary-card"><div class="label">Payments</div><div class="value">${data.period.payments.count}</div></div>
      <div class="summary-card"><div class="label">Gross</div><div class="value">${formatMoney(data.period.payments.gross)}</div></div>
      <div class="summary-card"><div class="label">Net collected</div><div class="value">${formatMoney(data.period.payments.net)}</div></div>
    </div>

    <h2 style="font-family:'Plus Jakarta Sans'; font-size:12pt; margin:22px 0 10px;">Active enrollment by level</h2>
    <table>
      <colgroup><col style="width:70%" /><col style="width:30%" /></colgroup>
      <thead><tr><th>Level</th><th class="num">Students</th></tr></thead>
      <tbody>${enrollmentRows || `<tr><td colspan="2" class="muted">No active students.</td></tr>`}</tbody>
    </table>
    <p style="margin-top:10px; font-size:9pt;" class="muted">Total active students: ${data.enrollment.total}</p>
  `;

  return renderReportShell({ title: "Dashboard Snapshot", subtitle: "Enrollment and fee overview", bodyHtml });
}
