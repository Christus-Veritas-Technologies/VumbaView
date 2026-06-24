import { getReportAssets } from "./assets";

/// Shared HTML shell every report (per-page "Generate Report" exports AND
/// the dedicated Reports page's 3 templates) renders through, so all of them
/// get the same fonts, header banner, table rules, and footer for free.

const SCHOOL_NAME = "VumbaView Academy";

/** "23 Jun 2026" — day-MonthName-year is unambiguous everywhere, unlike
 * "06/23/26" (US) vs "23/06/26" (UK), which is the whole reason this helper
 * exists instead of letting each report format dates ad hoc. */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(d);
}

/** "23 Jun 2026, 14:32" — same unambiguous date plus a 24h time, for rows
 * where the exact moment (not just the day) matters, e.g. a payment log. */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const datePart = formatDate(d);
  const timePart = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
  return `${datePart}, ${timePart}`;
}

export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface ReportShellOptions {
  /** Big title in the in-flow banner, e.g. "All Payments". */
  title: string;
  /** Small line under the title, e.g. "Full payment history, all terms". */
  subtitle?: string;
  /** Shown as a pill in the banner when the report is scoped to a range,
   * e.g. "1 Jun 2026 – 23 Jun 2026". Omitted entirely for reports that cover
   * everything (no range was picked). */
  rangeLabel?: string;
  /** The report's own content — usually a summary row + a <table>. */
  bodyHtml: string;
}

/** Plain-text, generic-sans footer rendered by Chromium's own header/footer
 * template engine (a separate, sandboxed context that can't load this
 * file's embedded @font-face fonts — see lib/pdf.ts) on every page. */
export function reportFooterTemplate(generatedAtLabel: string): string {
  return `
    <div style="width: 100%; font-size: 8px; color: #94a3b8; font-family: Helvetica, Arial, sans-serif; padding: 0 12mm; display: flex; justify-content: space-between;">
      <span>${SCHOOL_NAME} &middot; Generated ${generatedAtLabel}</span>
      <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
    </div>
  `;
}

export function renderReportShell(options: ReportShellOptions): string {
  const assets = getReportAssets();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Inter";
    font-weight: 400;
    src: url(data:font/ttf;base64,${assets.fonts.interRegular}) format("truetype");
  }
  @font-face {
    font-family: "Inter";
    font-weight: 500;
    src: url(data:font/ttf;base64,${assets.fonts.interMedium}) format("truetype");
  }
  @font-face {
    font-family: "Inter";
    font-weight: 600;
    src: url(data:font/ttf;base64,${assets.fonts.interSemiBold}) format("truetype");
  }
  @font-face {
    font-family: "Inter";
    font-weight: 700;
    src: url(data:font/ttf;base64,${assets.fonts.interBold}) format("truetype");
  }
  @font-face {
    font-family: "Plus Jakarta Sans";
    font-weight: 700;
    src: url(data:font/ttf;base64,${assets.fonts.jakartaBold}) format("truetype");
  }
  @font-face {
    font-family: "Plus Jakarta Sans";
    font-weight: 800;
    src: url(data:font/ttf;base64,${assets.fonts.jakartaExtraBold}) format("truetype");
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Inter", Helvetica, Arial, sans-serif;
    font-size: 10pt;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }

  .banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #fbf7ec;
    border-bottom: 3px solid #a37a1d;
    border-radius: 10px;
    padding: 18px 22px;
    margin-bottom: 22px;
  }
  .banner-left { display: flex; align-items: center; gap: 14px; }
  .banner-logo { width: 46px; height: 46px; border-radius: 10px; object-fit: cover; }
  .banner-wordmark { font-family: "Plus Jakarta Sans"; font-weight: 800; font-size: 12pt; color: #503e19; letter-spacing: 0.2px; }
  .banner-title { font-family: "Plus Jakarta Sans"; font-weight: 800; font-size: 18pt; color: #0f172a; margin-top: 2px; }
  .banner-subtitle { font-size: 9pt; color: #62543a; margin-top: 2px; }
  .banner-right { text-align: right; }
  .banner-range {
    display: inline-block;
    font-family: "Inter";
    font-weight: 600;
    font-size: 8.5pt;
    color: #80601a;
    background: #f5ebcf;
    border: 1px solid #ead89d;
    border-radius: 999px;
    padding: 5px 12px;
  }

  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th, td {
    padding: 7px 8px;
    font-size: 9pt;
    text-align: left;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  thead th {
    font-family: "Inter";
    font-weight: 600;
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #80601a;
    background: #fbf7ec;
    border-bottom: 1.5px solid #ead89d;
  }
  tbody tr { border-bottom: 1px solid #f1f5f9; page-break-inside: avoid; }
  tbody tr:nth-child(even) { background: #fafaf9; }
  .num { text-align: right; }
  .muted { color: #64748b; }

  .summary-row { display: flex; gap: 14px; margin-bottom: 18px; }
  .summary-card {
    flex: 1;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
  }
  .summary-card .label { font-size: 8pt; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
  .summary-card .value { font-family: "Plus Jakarta Sans"; font-weight: 700; font-size: 14pt; color: #0f172a; margin-top: 3px; }

  .badge { display: inline-block; border-radius: 999px; padding: 2px 9px; font-size: 8pt; font-weight: 600; }
  .badge-paid { background: #ecfdf5; color: #047857; }
  .badge-partial { background: #fff7ed; color: #c2410c; }
  .badge-unpaid { background: #fef2f2; color: #b91c1c; }
</style>
</head>
<body>
  <div class="banner">
    <div class="banner-left">
      <img class="banner-logo" src="data:image/png;base64,${assets.logoBase64}" />
      <div>
        <div class="banner-wordmark">${SCHOOL_NAME}</div>
        <div class="banner-title">${options.title}</div>
        ${options.subtitle ? `<div class="banner-subtitle">${options.subtitle}</div>` : ""}
      </div>
    </div>
    ${options.rangeLabel ? `<div class="banner-right"><span class="banner-range">${options.rangeLabel}</span></div>` : ""}
  </div>
  ${options.bodyHtml}
</body>
</html>`;
}
