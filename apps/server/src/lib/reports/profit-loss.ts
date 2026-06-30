import { formatDate, formatMoney, renderReportShell } from "./template";

export interface ProfitLossData {
  termNumber: number;
  termStartedAt: Date;
  termEndedAt: Date; // next term start, or "now" for current
  isCurrent: boolean;
  revenueLines: { label: string; amount: number }[];
  expenseLines: { label: string; amount: number }[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function incomeRow(label: string, amount: number, bold = false): string {
  const cls = bold ? " class=\"total-row\"" : "";
  return `<tr${cls}><td>${escapeHtml(label)}</td><td class="num">${formatMoney(amount)}</td></tr>`;
}

function divider(): string {
  return `<tr class="divider-row"><td colspan="2"></td></tr>`;
}

function sectionHeader(label: string): string {
  return `<tr class="section-header"><td colspan="2">${escapeHtml(label)}</td></tr>`;
}

export function buildProfitLossReportHtml(data: ProfitLossData): string {
  const totalRevenue = data.revenueLines.reduce((s, l) => s + l.amount, 0);
  const totalExpenses = data.expenseLines.reduce((s, l) => s + l.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const isProfit = netProfit >= 0;

  const periodLabel = `${formatDate(data.termStartedAt)} – ${formatDate(data.termEndedAt)}`;
  const termLabel = `Term #${data.termNumber}${data.isCurrent ? " (Current)" : ""}`;

  // Revenue section rows
  const revenueRows =
    data.revenueLines.length > 0
      ? data.revenueLines.map((l) => incomeRow(l.label, l.amount)).join("")
      : `<tr><td class="muted" colspan="2">No income recorded</td></tr>`;

  // Expense section rows
  const expenseRows =
    data.expenseLines.length > 0
      ? data.expenseLines.map((l) => incomeRow(l.label, l.amount)).join("")
      : `<tr><td class="muted" colspan="2">No expenses recorded</td></tr>`;

  const netRowClass = isProfit ? "net-profit" : "net-loss";
  const netLabel = isProfit ? "NET PROFIT" : "NET LOSS";
  const netDisplay = isProfit ? formatMoney(netProfit) : `(${formatMoney(Math.abs(netProfit))})`;

  const bodyHtml = `
    <div class="period-block">
      <span class="period-term">${escapeHtml(termLabel)}</span>
      <span class="period-range">${escapeHtml(periodLabel)}</span>
    </div>

    <table class="statement-table">
      <colgroup>
        <col style="width:72%" />
        <col style="width:28%" />
      </colgroup>

      ${sectionHeader("REVENUE")}
      ${revenueRows}
      ${divider()}
      ${incomeRow("TOTAL REVENUE", totalRevenue, true)}

      <tr class="spacer-row"><td colspan="2"></td></tr>

      ${sectionHeader("EXPENDITURE")}
      ${expenseRows}
      ${divider()}
      ${incomeRow("TOTAL EXPENDITURE", totalExpenses, true)}

      <tr class="spacer-row"><td colspan="2"></td></tr>

      <tr class="net-row ${netRowClass}">
        <td>${netLabel}</td>
        <td class="num">${netDisplay}</td>
      </tr>
      <tr class="double-rule-row"><td colspan="2"></td></tr>
    </table>
  `;

  const extraCss = `
    .period-block {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 22px;
    }
    .period-term {
      font-family: "Plus Jakarta Sans";
      font-weight: 700;
      font-size: 13pt;
      color: #0f172a;
    }
    .period-range {
      font-size: 9pt;
      color: #64748b;
    }

    .statement-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .statement-table td {
      padding: 5px 8px;
      font-size: 10pt;
    }
    .statement-table .num { text-align: right; }

    .section-header td {
      font-family: "Plus Jakarta Sans";
      font-weight: 800;
      font-size: 8.5pt;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #80601a;
      background: #fbf7ec;
      border-bottom: 1.5px solid #ead89d;
      padding: 6px 8px 5px;
    }

    .total-row td {
      font-weight: 600;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      background: #f8fafc;
    }

    .divider-row td { height: 0; padding: 0; border: none; }
    .spacer-row td { height: 14px; padding: 0; border: none; }

    .net-row td {
      font-family: "Plus Jakarta Sans";
      font-weight: 800;
      font-size: 12pt;
      padding: 10px 8px;
      border-top: 2px solid #0f172a;
    }
    .net-profit td { color: #047857; }
    .net-loss td { color: #b91c1c; }
    .double-rule-row td { height: 3px; background: #0f172a; }
  `;

  return renderReportShell({
    title: "Income Statement",
    subtitle: "Profit &amp; Loss — prepared for management",
    bodyHtml,
    extraCss,
  });
}
