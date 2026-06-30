import { formatDateTime, formatMoney, renderReportShell } from "./template";

export interface ExpenseReportRow {
  occurredAt: Date;
  category: string;
  amount: number;
  note: string | null;
  recordedBy: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAllExpensesReportHtml(expenses: ExpenseReportRow[], rangeLabel?: string): string {
  const rows = expenses
    .map(
      (e) => `
    <tr>
      <td>${formatDateTime(e.occurredAt)}</td>
      <td>${escapeHtml(e.category)}</td>
      <td class="num">${formatMoney(e.amount)}</td>
      <td>${escapeHtml(e.recordedBy)}</td>
      <td class="muted">${e.note ? escapeHtml(e.note) : "—"}</td>
    </tr>`,
    )
    .join("");

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const bodyHtml = `
    <div class="summary-row">
      <div class="summary-card"><div class="label">Expenses</div><div class="value">${expenses.length}</div></div>
      <div class="summary-card"><div class="label">Total spent</div><div class="value">${formatMoney(total)}</div></div>
    </div>
    <table>
      <colgroup>
        <col style="width:18%" /><col style="width:22%" /><col style="width:14%" /><col style="width:16%" /><col style="width:30%" />
      </colgroup>
      <thead>
        <tr>
          <th>Date</th><th>Category</th><th class="num">Amount</th><th>Recorded by</th><th>Note</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5" class="muted">No expenses found.</td></tr>`}</tbody>
    </table>
  `;

  return renderReportShell({
    title: "All Expenses",
    subtitle: "School-level expenditure log",
    rangeLabel,
    bodyHtml,
  });
}
