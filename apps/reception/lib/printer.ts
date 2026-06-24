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
  | "LOCATION_SERVICES_OFF"
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

const LOG = "[printer]";

/**
 * `BluetoothManager.scanDevices()`'s actual resolved shape doesn't match the
 * package's own .d.ts (`Promise<{ paired: BluetoothDevice[]; found:
 * BluetoothDevice[] }>`) — that type is a hand-written guess, while index.js
 * forwards the raw native module untouched. The README's own usage example
 * does `JSON.parse(s)` on the resolved value, confirming it's actually a
 * JSON-encoded string. Upstream forks have also shown `.paired`/`.found`
 * themselves arriving as JSON-encoded strings rather than arrays in some
 * versions, so this parses defensively instead of trusting either shape.
 */
function parseDeviceList(value: unknown): BluetoothDevice[] {
  if (Array.isArray(value)) return value as BluetoothDevice[];
  if (typeof value === "string" && value.length > 0) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error(`${LOG} parseDeviceList: failed to JSON.parse device list string:`, e);
      return [];
    }
  }
  return [];
}

function parseScanResult(raw: unknown): { paired: BluetoothDevice[]; found: BluetoothDevice[] } {
  let obj: { paired?: unknown; found?: unknown } = {};
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch (e) {
      console.error(`${LOG} parseScanResult: failed to JSON.parse scan result string:`, e);
    }
  } else if (raw && typeof raw === "object") {
    obj = raw as { paired?: unknown; found?: unknown };
  }
  return { paired: parseDeviceList(obj.paired), found: parseDeviceList(obj.found) };
}

/** Requests the runtime permissions classic Bluetooth scanning needs. */
async function requestBluetoothPermissions(): Promise<boolean> {
  console.log(`${LOG} requesting Bluetooth permissions:`, BLUETOOTH_PERMISSIONS);
  try {
    const results = await PermissionsAndroid.requestMultiple(BLUETOOTH_PERMISSIONS);
    console.log(`${LOG} permission results:`, results);
    const granted = Object.values(results).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
    console.log(`${LOG} permissions ${granted ? "granted" : "denied"}`);
    return granted;
  } catch (e) {
    // Permission constants that don't exist on this OS version (e.g.
    // BLUETOOTH_SCAN on Android < 12) reject rather than no-op on some
    // RN versions — treat that as "nothing to grant" instead of a failure.
    console.log(`${LOG} permission request threw, treating as granted (likely unsupported constant on this OS):`, e);
    return true;
  }
}

/** Ensures Bluetooth is on and we hold scan/connect permissions. */
export async function ensureBluetoothReady(): Promise<PrinterResult<void>> {
  console.log(`${LOG} ensureBluetoothReady: start`);
  if (!isPrinterSupported()) {
    console.log(`${LOG} ensureBluetoothReady: unsupported platform (${Platform.OS})`);
    return err("UNSUPPORTED_PLATFORM", "Bluetooth printing is only available on Android devices.");
  }

  const granted = await requestBluetoothPermissions();
  if (!granted) {
    console.error(`${LOG} ensureBluetoothReady: permission denied`);
    return err("PERMISSION_DENIED", "Bluetooth permission was denied. Enable it in system settings to print.");
  }

  try {
    const enabled = await BluetoothManager.isBluetoothEnabled();
    console.log(`${LOG} ensureBluetoothReady: adapter enabled =`, enabled);
    if (!enabled) {
      console.log(`${LOG} ensureBluetoothReady: requesting user to enable Bluetooth`);
      const turnedOn = await BluetoothManager.enableBluetooth();
      console.log(`${LOG} ensureBluetoothReady: enableBluetooth result =`, turnedOn);
      if (!turnedOn) {
        console.error(`${LOG} ensureBluetoothReady: user declined to enable Bluetooth`);
        return err("BLUETOOTH_DISABLED", "Bluetooth is turned off. Turn it on to print a receipt.");
      }
    }
    console.log(`${LOG} ensureBluetoothReady: ready`);
    return ok(undefined);
  } catch (e) {
    console.error(`${LOG} ensureBluetoothReady: failed to reach Bluetooth adapter:`, e);
    return err("BLUETOOTH_DISABLED", "Couldn't reach the Bluetooth adapter on this device.");
  }
}

/** Scans for nearby printers, merging paired and freshly-discovered devices. */
export async function listPrinters(): Promise<PrinterResult<PrinterDevice[]>> {
  console.log(`${LOG} listPrinters: start`);
  const ready = await ensureBluetoothReady();
  if (!ready.ok) {
    console.error(`${LOG} listPrinters: aborting, Bluetooth not ready:`, ready.error);
    return ready;
  }

  try {
    console.log(`${LOG} listPrinters: scanning for devices…`);
    const raw = await BluetoothManager.scanDevices();
    console.log(`${LOG} listPrinters: raw scan result (type=${typeof raw}):`, raw);
    const { paired, found } = parseScanResult(raw);
    console.log(`${LOG} listPrinters: scan complete — paired=${paired.length}, found=${found.length}`);
    const byAddress = new Map<string, PrinterDevice>();
    for (const d of paired) byAddress.set(d.address, { ...d, paired: true });
    for (const d of found) {
      if (!byAddress.has(d.address)) byAddress.set(d.address, { ...d, paired: false });
    }
    const devices = Array.from(byAddress.values());
    console.log(
      `${LOG} listPrinters: returning ${devices.length} device(s):`,
      devices.map((d) => `${d.name || "unnamed"} (${d.address})`),
    );
    return ok(devices);
  } catch (e) {
    console.error(`${LOG} listPrinters: scan failed:`, e);
    // The underlying native module throws { code: "DISCOVER", message: "NOT_STARTED" }
    // almost exclusively when the device's system Location service is turned off —
    // Android requires it for classic Bluetooth discovery on API 29+, even though
    // the app already holds the BLUETOOTH_SCAN/ACCESS_FINE_LOCATION *permissions*.
    // This is a well-documented quirk of this library, not a bug in this app:
    // https://github.com/januslo/react-native-bluetooth-escpos-printer/issues/120
    const code = (e as { code?: string } | null)?.code;
    const message = (e as { message?: string } | null)?.message;
    if (code === "DISCOVER" || message === "NOT_STARTED") {
      console.error(`${LOG} listPrinters: scan failed with NOT_STARTED — Location services are very likely off`);
      return err(
        "LOCATION_SERVICES_OFF",
        "Turn on Location (GPS) in this device's settings, then try again — Android requires it for Bluetooth scanning.",
      );
    }
    return err("UNKNOWN", "Couldn't scan for nearby Bluetooth printers.");
  }
}

export async function connectPrinter(address: string): Promise<PrinterResult<void>> {
  console.log(`${LOG} connectPrinter: connecting to ${address}…`);
  const ready = await ensureBluetoothReady();
  if (!ready.ok) {
    console.error(`${LOG} connectPrinter: aborting, Bluetooth not ready:`, ready.error);
    return ready;
  }

  try {
    await BluetoothManager.connect(address);
    console.log(`${LOG} connectPrinter: connected to ${address}`);
    return ok(undefined);
  } catch (e) {
    console.error(`${LOG} connectPrinter: failed to connect to ${address}:`, e);
    return err("CONNECTION_FAILED", "Couldn't connect to that printer. Make sure it's powered on and in range.");
  }
}

/** Best-effort check — never throws, just reports null if anything goes wrong. */
export async function getConnectedPrinter(): Promise<BluetoothDevice | null> {
  if (!isPrinterSupported()) {
    console.log(`${LOG} getConnectedPrinter: unsupported platform (${Platform.OS})`);
    return null;
  }
  try {
    const device = await BluetoothManager.getConnectedDevice();
    console.log(
      `${LOG} getConnectedPrinter:`,
      device ? `${device.name || "unnamed"} (${device.address})` : "none connected",
    );
    return device;
  } catch (e) {
    console.error(`${LOG} getConnectedPrinter: check failed, treating as not connected:`, e);
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
  /** Net cash, full credit — discount given (if any) and the resulting net
   * cash collected. Both optional/undefined for receipts with no discount. */
  discount?: number | null;
  netAmount?: number | null;
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
  if (data.discount != null && data.discount > 0) {
    lines.push(row("Discount:", `-$${data.discount.toFixed(2)}`));
    lines.push(row("Net cash:", `$${(data.netAmount ?? data.amount - data.discount).toFixed(2)}`));
  }
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
  console.log(`${LOG} printReceipt: start for receipt ${data.receiptId}, student "${data.studentName}"`);
  if (!isPrinterSupported()) {
    console.log(`${LOG} printReceipt: unsupported platform (${Platform.OS})`);
    return err("UNSUPPORTED_PLATFORM", "Bluetooth printing is only available on Android devices.");
  }

  const connected = await getConnectedPrinter();
  if (!connected) {
    console.error(`${LOG} printReceipt: no printer connected, aborting`);
    return err("NO_DEVICE_SELECTED", "No printer connected. Choose a printer first.");
  }
  console.log(`${LOG} printReceipt: printing via ${connected.name || "unnamed"} (${connected.address})`);

  try {
    const text = formatReceiptText(data);
    console.log(`${LOG} printReceipt: formatted ${text.length} chars, sending to printer…`);
    await BluetoothEscposPrinter.printText(text, {
      encoding: "GBK",
      codepage: 0,
      widthtimes: 0,
      heigthtimes: 0,
      fonttype: 1,
    });
    console.log(`${LOG} printReceipt: printText done, cutting paper…`);
    await BluetoothEscposPrinter.cutPaper();
    console.log(`${LOG} printReceipt: success`);
    return ok(undefined);
  } catch (e) {
    console.error(`${LOG} printReceipt: failed partway through:`, e);
    return err("PRINT_FAILED", "Printing failed partway through. Check the printer and try again.");
  }
}
