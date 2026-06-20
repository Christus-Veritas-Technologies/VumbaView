import { PermissionsAndroid, Platform } from "react-native";
import {
  BluetoothManager,
  BluetoothEscposPrinter,
  type BluetoothDevice,
} from "@vardrz/react-native-bluetooth-escpos-printer";

/**
 * Thin, typed wrapper around @vardrz/react-native-bluetooth-escpos-printer.
 *
 * Android-only: classic 58mm thermal printers pair over Bluetooth Classic
 * (SPP), which iOS does not expose to third-party apps (Apple restricts
 * Bluetooth Classic to MFi-certified accessories). Every function here
 * short-circuits with UNSUPPORTED_PLATFORM on iOS/web rather than touching
 * the native module, so callers never need their own Platform.OS checks.
 */

export type PrinterErrorCode =
  | "UNSUPPORTED_PLATFORM"
  | "BLUETOOTH_DISABLED"
  | "PERMISSION_DENIED"
  | "NO_DEVICE_SELECTED"
  | "CONNECTION_FAILED"
  | "PRINT_FAILED"
  | "UNKNOWN";

export interface PrinterError {
  code: PrinterErrorCode;
  message: string;
}

export type PrinterResult<T> = { ok: true; data: T } | { ok: false; error: PrinterError };

export interface PrinterDevice extends BluetoothDevice {
  paired: boolean;
}

function err(code: PrinterErrorCode, message: string): PrinterResult<never> {
  return { ok: false, error: { code, message } };
}

function ok<T>(data: T): PrinterResult<T> {
  return { ok: true, data };
}

export function isPrinterSupported(): boolean {
  return Platform.OS === "android";
}

// Cast via the function's own parameter type rather than importing RN's
// `Permission` union directly — robust to whichever RN/TS version is
// installed, and avoids guessing at the exact type's export path.
type RequestMultipleArg = Parameters<typeof PermissionsAndroid.requestMultiple>[0];

const BLUETOOTH_PERMISSIONS = [
  "android.permission.BLUETOOTH_SCAN",
  "android.permission.BLUETOOTH_CONNECT",
  "android.permission.ACCESS_FINE_LOCATION",
] as unknown as RequestMultipleArg;

/** Requests the runtime permissions classic Bluetooth scanning needs. */
async function requestBluetoothPermissions(): Promise<boolean> {
  try {
    const results = await PermissionsAndroid.requestMultiple(BLUETOOTH_PERMISSIONS);
    return Object.values(results).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    // Permission constants that don't exist on this OS version (e.g.
    // BLUETOOTH_SCAN on Android < 12) reject rather than no-op on some
    // RN versions — treat that as "nothing to grant" instead of a failure.
    return true;
  }
}

/** Ensures Bluetooth is on and we hold scan/connect permissions. */
export async function ensureBluetoothReady(): Promise<PrinterResult<void>> {
  if (!isPrinterSupported()) {
    return err("UNSUPPORTED_PLATFORM", "Bluetooth printing is only available on Android devices.");
  }

  const granted = await requestBluetoothPermissions();
  if (!granted) {
    return err("PERMISSION_DENIED", "Bluetooth permission was denied. Enable it in system settings to print.");
  }

  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();
    if (!enabled) {
      const turnedOn = await BluetoothManager.enableBluetooth();
      if (!turnedOn) {
        return err("BLUETOOTH_DISABLED", "Bluetooth is turned off. Turn it on to print a receipt.");
      }
    }
    return ok(undefined);
  } catch {
    return err("BLUETOOTH_DISABLED", "Couldn't reach the Bluetooth adapter on this device.");
  }
}

/** Scans for nearby printers, merging paired and freshly-discovered devices. */
export async function listPrinters(): Promise<PrinterResult<PrinterDevice[]>> {
  const ready = await ensureBluetoothReady();
  if (!ready.ok) return ready;

  try {
    const { paired, found } = await BluetoothManager.scanDevices();
    const byAddress = new Map<string, PrinterDevice>();
    for (const d of paired) byAddress.set(d.address, { ...d, paired: true });
    for (const d of found) {
      if (!byAddress.has(d.address)) byAddress.set(d.address, { ...d, paired: false });
    }
    return ok(Array.from(byAddress.values()));
  } catch {
    return err("UNKNOWN", "Couldn't scan for nearby Bluetooth printers.");
  }
}

export async function connectPrinter(address: string): Promise<PrinterResult<void>> {
  const ready = await ensureBluetoothReady();
  if (!ready.ok) return ready;

  try {
    await BluetoothManager.connect(address);
    return ok(undefined);
  } catch {
    return err("CONNECTION_FAILED", "Couldn't connect to that printer. Make sure it's powered on and in range.");
  }
}

/** Best-effort check — never throws, just reports null if anything goes wrong. */
export async function getConnectedPrinter(): Promise<BluetoothDevice | null> {
  if (!isPrinterSupported()) return null;
  try {
    return await BluetoothManager.getConnectedDevice();
  } catch {
    return null;
  }
}

const RECEIPT_WIDTH = 32; // standard column count for 58mm thermal paper at normal font size

function center(text: string, width = RECEIPT_WIDTH): string {
  if (text.length >= width) return text;
  const pad = Math.floor((width - text.length) / 2);
  return " ".repeat(pad) + text;
}

function row(label: string, value: string, width = RECEIPT_WIDTH): string {
  const gap = width - label.length - value.length;
  if (gap < 1) return `${label} ${value}`;
  return `${label}${" ".repeat(gap)}${value}`;
}

const DIVIDER = "-".repeat(RECEIPT_WIDTH);

export interface ReceiptPrintData {
  schoolName: string;
  receiptId: string;
  occurredAt: string;
  studentName: string;
  level?: string | null;
  admissionNo?: number | null;
  category: string;
  amount: number;
  note?: string | null;
  balanceAfter?: number | null;
  recordedBy?: string | null;
}

/** Formats a receipt as plain ESC/POS-ready text — no native calls, pure string logic. */
export function formatReceiptText(data: ReceiptPrintData): string {
  const lines: string[] = [];
  lines.push(center(data.schoolName));
  lines.push(center("PAYMENT RECEIPT"));
  lines.push(DIVIDER);
  lines.push(`Receipt #: ${data.receiptId.slice(-8)}`);
  lines.push(`Date: ${new Date(data.occurredAt).toLocaleString()}`);
  lines.push(`Student: ${data.studentName}`);
  if (data.level) lines.push(`Level: ${data.level}`);
  if (data.admissionNo != null) lines.push(`Admission #: ${data.admissionNo}`);
  lines.push(DIVIDER);
  lines.push(`Category: ${data.category}`);
  lines.push(row("Amount paid:", `$${data.amount.toFixed(2)}`));
  if (data.note) lines.push(`Note: ${data.note}`);
  if (data.balanceAfter != null) {
    lines.push(row("Balance after:", `$${data.balanceAfter.toFixed(2)}`));
  }
  lines.push(DIVIDER);
  if (data.recordedBy) lines.push(`Recorded by: ${data.recordedBy}`);
  lines.push(center("Thank you!"));
  lines.push("\n\n");
  return lines.join("\n");
}

export async function printReceipt(data: ReceiptPrintData): Promise<PrinterResult<void>> {
  if (!isPrinterSupported()) {
    return err("UNSUPPORTED_PLATFORM", "Bluetooth printing is only available on Android devices.");
  }

  const connected = await getConnectedPrinter();
  if (!connected) {
    return err("NO_DEVICE_SELECTED", "No printer connected. Choose a printer first.");
  }

  try {
    await BluetoothEscposPrinter.printText(formatReceiptText(data), {
      encoding: "GBK",
      codepage: 0,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 1,
    });
    await BluetoothEscposPrinter.cutPaper();
    return ok(undefined);
  } catch {
    return err("PRINT_FAILED", "Printing failed partway through. Check the printer and try again.");
  }
}
