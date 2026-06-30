import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { apiUrl } from "@/lib/api";
import { getToken } from "@/lib/storage/token";

export type ReportScope = "students" | "payments" | "dashboard" | "expenses";

export interface ReportBounds {
  earliest: string | null;
  latest: string | null;
}

/** Thrown for every failure in this module so callers can show its
 * `.message` directly — never the raw fetch/JSON-parse error. */
export class ReportError extends Error {}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Drives the report date-range picker's selectable min/max — always the
 * earliest and latest date actually present in that page's own data
 * (never hardcoded). Used by every "Generate Report" trigger that lets the
 * admin pick a range (Dashboard/Students/Payments) — the 3 fixed templates
 * on the dedicated Reports page don't need this since they have no range.
 */
export async function fetchReportBounds(scope: ReportScope): Promise<ReportBounds> {
  let res: Response;
  try {
    res = await fetch(apiUrl("/reports/bounds", { scope }), { headers: await authHeaders() });
  } catch {
    throw new ReportError("Couldn't reach the server — check your connection and try again.");
  }

  if (!res.ok) {
    throw new ReportError("Couldn't load the available date range for this report.");
  }

  return res.json();
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ReportError("Couldn't read the downloaded report."));
    reader.onload = () => {
      const result = reader.result as string;
      // reader.result is a data: URL ("data:application/pdf;base64,JVBERi0...") —
      // only the part after the comma is the base64 payload itself.
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetches a generated PDF and opens the OS share/save sheet — the same
 * file-delivery pattern any other app on the device uses for a download.
 * Every report trigger (the per-page "Generate Report" buttons and the
 * dedicated Reports page's 3 fixed templates) funnels through this single
 * function so loading, error, and success behavior is identical everywhere.
 */
export async function downloadAndShareReport(
  path: string,
  query: Record<string, string | undefined> | undefined,
  filename: string,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(apiUrl(path, query), { headers: await authHeaders() });
  } catch {
    throw new ReportError("Network request failed — check your connection and try again.");
  }

  if (!res.ok) {
    let message = `Couldn't generate this report (${res.status}).`;
    try {
      const data = await res.json();
      if (data && typeof data === "object" && "error" in data) {
        message = String((data as { error: unknown }).error);
      }
    } catch {
      // Error body wasn't JSON — keep the generic message above.
    }
    throw new ReportError(message);
  }

  let blob: Blob;
  try {
    blob = await res.blob();
  } catch {
    throw new ReportError("Couldn't read the report that came back from the server.");
  }

  const base64 = await blobToBase64(blob);
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  try {
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    throw new ReportError("Couldn't save the report to this device.");
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, { mimeType: "application/pdf", UTI: "com.adobe.pdf" });
  }
  // If sharing genuinely isn't available (very old/locked-down devices), the
  // PDF is still saved to the cache directory — every real Android/iOS
  // device in practice supports the share sheet, so no extra fallback UI.
}
