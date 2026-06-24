import puppeteer, { type Browser } from "puppeteer";
import { env } from "@vva/env/server";

/// Shared headless-Chromium renderer for every PDF report (per-page exports
/// AND the dedicated Reports page templates both funnel through this one
/// function — see lib/reports/*.ts for the HTML each report builds).
///
/// Kept entirely separate from lib/whatsapp.ts's Puppeteer client: that one
/// drives a persistent, authenticated WhatsApp Web session with its own
/// lifecycle (QR-scan auth, `LocalAuth` session directory, reconnect
/// handling); this one is a plain "give me a PDF of this HTML" renderer with
/// no session state. Sharing a single Browser instance between the two would
/// mean a WhatsApp disconnect/relaunch could take PDF generation down with
/// it, and vice versa.
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        executablePath: env.CHROMIUM_URL || puppeteer.executablePath(),
        // Same flags as lib/whatsapp.ts — required on headless Linux
        // containers, doubly so since the Docker image runs as root.
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }

  const browser = await browserPromise;

  // The shared browser can crash or be killed between requests (OOM, host
  // restart of the Chromium process, etc.) — `.connected` is cheap to check,
  // and relaunching here means one bad PDF request doesn't permanently wedge
  // every report endpoint until the whole server restarts.
  if (!browser.connected) {
    browserPromise = null;
    return getBrowser();
  }

  return browser;
}

export interface RenderPdfOptions {
  /** Slim, repeating page furniture rendered by Chromium itself (outside the
   * page's own DOM) — e.g. "VumbaView Academy · Page X of Y". Puppeteer
   * renders header/footer templates in an isolated context that can't
   * reliably load the embedded custom fonts from the main document, so this
   * is intentionally plain text in a generic sans, not the branded heading
   * font used in-page. */
  footerTemplate?: string;
  headerTemplate?: string;
  /** Reserves space for the footer template above. Puppeteer silently
   * clips/overlaps the footer if this is left too small. */
  marginBottom?: string;
  marginTop?: string;
}

/** Renders an HTML string to a PDF buffer on A4, with backgrounds (gradients/
 * brand colors) preserved. */
export async function renderHtmlToPdf(html: string, options: RenderPdfOptions = {}): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0" });

    const hasFooter = Boolean(options.footerTemplate);
    const hasHeader = Boolean(options.headerTemplate);

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: hasFooter || hasHeader,
      headerTemplate: options.headerTemplate ?? "<span></span>",
      footerTemplate: options.footerTemplate ?? "<span></span>",
      margin: {
        top: options.marginTop ?? (hasHeader ? "20mm" : "12mm"),
        bottom: options.marginBottom ?? (hasFooter ? "16mm" : "12mm"),
        left: "12mm",
        right: "12mm",
      },
    });

    return Buffer.from(buffer);
  } finally {
    await page.close();
  }
}
