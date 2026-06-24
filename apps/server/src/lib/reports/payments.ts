import { LEVEL_LABELS } from "../levels";
import { formatDateTime, formatMoney, renderReportShell } from "./template";
import type { AcademicLevel, PaymentCategory } from "@prisma/client";

export interface PaymentReportRow {
  occurredAt: Date;
  studentName: string;
  admissionNo: number;
  level: AcademicLevel;
  category: PaymentCategory;
  amount: number;
  discount: number;
  note: string | null;
  recordedBy: string;
}

/** "All payments (full info)" — every payment, every category, with the
 * discount and net columns the dashboard's net-collected figure is built
 * from, so the report and the dashboard never disagree on the math. */
export function buildAllPaymentsReportHtml(payments: PaymentReportRow[], rangeLabel?: string): string {
  const rows = payments
    .map((p) => {
      const net = p.amount - p.discount;
      return `
    <tr>
      <td>${formatDateTime(p.occurredAt)}</td>
      <td>${escapeHtml(p.studentName)} <span class="muted">(#${p.admissionNo})</span></td>
      <td>${LEVEL_LABELS[p.level]}</td>
      <td>${p.category}</td>
      <td class="num">${formatMoney(p.amount)}</td>
      <td class="num">${p.discount > 0 ? formatMoney(p.discount) : "—"}</td>
      <td class="num">${formatMoney(net)}</td>
      <td>${escapeHtml(p.recordedBy)}</td>
      <td class="muted">${p.note ? escapeHtml(p.note) : "—"}</td>
    </tr>`;
    })
    .join("");

  const grossTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const discountTotal = payments.reduce((sum, p) => sum + p.discount, 0);
  const netTotal = grossTotal - discountTotal;

  const bodyHtml = `
    <div class="summary-row">
      <div class="summary-card"><div class="label">Payments</div><div class="value">${payments.length}</div></div>
      <div class="summary-card"><div class="label">Gross</div><div class="value">${formatMoney(grossTotal)}</div></div>
      <div class="summary-card"><div class="label">Discounts</div><div class="value">${formatMoney(discountTotal)}</div></div>
      <div class="summary-card"><div class="label">Net collected</div><div class="value">${formatMoney(netTotal)}</div></div>
    </div>
    <table>
      <colgroup>
        <col style="width:13%" /><col style="width:20%" /><col style="width:10%" /><col style="width:9%" />
        <col style="width:10%" /><col style="width:9%" /><col style="width:10%" /><col style="width:10%" /><col style="width:9%" />
      </colgroup>
      <thead>
        <tr>
          <th>Date</th><th>Student</th><th>Level</th><th>Category</th>
          <th class="num">Amount</th><th class="num">Discount</th><th class="num">Net</th><th>Recorded by</th><th>Note</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="9" class="muted">No payments found.</td></tr>`}</tbody>
    </table>
  `;

  return renderReportShell({
    title: "All Payments",
    subtitle: "Full payment history with discounts and net totals",
    rangeLabel,
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
