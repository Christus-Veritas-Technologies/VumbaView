import { useCallback, useState } from "react";
import { downloadAndShareReport, ReportError } from "@/lib/reports";

/**
 * Shared loading/error state machine for every report trigger in the app —
 * the per-page "Generate Report" buttons (with a date range) and the
 * dedicated Reports page's one-tap fixed templates (no range). Mirrors the
 * shape of use-printer-flow.ts so both flows read the same way: call
 * `download()`, it flips `downloading` immediately, and resolves to whether
 * it succeeded so the caller can close its sheet/card.
 */
export function useReportDownload() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(
    async (path: string, query: Record<string, string | undefined> | undefined, filename: string) => {
      setDownloading(true);
      setError(null);
      try {
        await downloadAndShareReport(path, query, filename);
        return true;
      } catch (err) {
        setError(err instanceof ReportError ? err.message : "Couldn't generate this report. Please try again.");
        return false;
      } finally {
        setDownloading(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setError(null), []);

  return { downloading, error, download, clearError };
}
