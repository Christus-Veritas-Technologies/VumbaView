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

// The package's .d.ts declares `getConnectedDevice(): Promise<BluetoothDevice
// | null>` on BluetoothManager, but — same lesson as scanDevices() above —
// that's an aspirational type, not reality: the native module on this device
// has no such method ("is not a function"), which is why printReceipt() was
// always seeing "no printer connected" and silently no-op'ing even though
// connect() itself had already succeeded (hence the printer's blue light).
// Track the connected device ourselves in JS instead of trusting a native
// introspection method that doesn't exist on this fork/build.
let connectedDeviceState: BluetoothDevice | null = null;

export async function connectPrinter(address: string, name?: string): Promise<PrinterResult<void>> {
  console.log(`${LOG} connectPrinter: connecting to ${address}…`);
  const ready = await ensureBluetoothReady();
  if (!ready.ok) {
    console.error(`${LOG} connectPrinter: aborting, Bluetooth not ready:`, ready.error);
    return ready;
  }

  try {
    await BluetoothManager.connect(address);
    connectedDeviceState = { address, name: name ?? "" };
    console.log(`${LOG} connectPrinter: connected to ${address}`);
    return ok(undefined);
  } catch (e) {
    connectedDeviceState = null;
    console.error(`${LOG} connectPrinter: failed to connect to ${address}:`, e);
    return err("CONNECTION_FAILED", "Couldn't connect to that printer. Make sure it's powered on and in range.");
  }
}

/** Best-effort check — never throws, just reports null if anything goes wrong.
 * Reads our own in-memory tracking (see connectedDeviceState above) rather
 * than the native module, which doesn't actually implement this lookup. */
export async function getConnectedPrinter(): Promise<BluetoothDevice | null> {
  if (!isPrinterSupported()) {
    console.log(`${LOG} getConnectedPrinter: unsupported platform (${Platform.OS})`);
    return null;
  }
  console.log(
    `${LOG} getConnectedPrinter:`,
    connectedDeviceState ? `${connectedDeviceState.name || "unnamed"} (${connectedDeviceState.address})` : "none connected",
  );
  return connectedDeviceState;
}

const RECEIPT_WIDTH = 32; // standard column count for 58mm thermal paper at normal (1x) character width

/** Right-flushes `value` against `label`, e.g. "Amount paid:      $50.00" —
 * used only for the financial figures, so they line up in a column. */
function row(label: string, value: string, width = RECEIPT_WIDTH): string {
  const gap = width - label.length - value.length;
  if (gap < 1) return `${label} ${value}`;
  return `${label}${" ".repeat(gap)}${value}`;
}

const DIVIDER = "-".repeat(RECEIPT_WIDTH);

// Fixed branding — not per-payment data, so these live here as constants
// rather than fields on ReceiptPrintData. Kept strictly ASCII: printText
// below sends everything through GBK encoding, and non-ASCII punctuation
// (em dashes, curly quotes, bullets) has no guaranteed glyph in a thermal
// printer's built-in font table and can print as a garbled/invalid box.
const SCHOOL_ADDRESS = "Stand Number 3, Chishakwe, Mutare";
const SCHOOL_PHONE = "0775 101 506";
const SCHOOL_EMAIL = "info@vumbaview.academy";

// Base URL the printed QR code points at: `${WEBSITE_BASE_URL}/verify/<id>`,
// a page on the school's website that looks up the payment and confirms it's
// genuine. EXPO_PUBLIC_-prefixed so Expo inlines it into the built app (see
// .env.example) — same convention as EXPO_PUBLIC_API_URL in lib/api.ts.
const RAW_WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL ?? "https://vumbaview.academy";
const WEBSITE_BASE_URL = RAW_WEBSITE_URL.replace(/\/+$/, "");

function buildVerifyUrl(receiptId: string): string {
  return `${WEBSITE_BASE_URL}/verify/${encodeURIComponent(receiptId)}`;
}

/** e.g. "Monday, June 22, 2026". Falls back gracefully if occurredAt somehow doesn't parse. */
function formatReadableDate(occurredAt: string): string {
  const d = new Date(occurredAt);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/** e.g. "2:14 PM" */
function formatReadableTime(occurredAt: string): string {
  const d = new Date(occurredAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// vardrz's index.d.ts omits printerAlign and setBlob even though both are
// real native methods on this exact module — confirmed directly against the
// bundled Android source (RNBluetoothEscposPrinterModule.java#printerAlign,
// #setBlob). Same lesson as parseDeviceList/getConnectedPrinter above: trust
// the native source, not this package's own incomplete .d.ts. Cast through
// this narrow interface instead of `any` so every other call on
// BluetoothEscposPrinter still gets the package's real typing.
interface UndeclaredPrinterMethods {
  printerAlign(align: number): Promise<void>;
  setBlob(weight: number): Promise<void>;
}
const printerExt = BluetoothEscposPrinter as typeof BluetoothEscposPrinter & UndeclaredPrinterMethods;

async function alignCenter(): Promise<void> {
  await printerExt.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
}

async function alignLeft(): Promise<void> {
  await printerExt.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
}

/** Best-effort — a printer that chokes on the bold command should still print everything else. */
async function setBold(on: boolean): Promise<void> {
  try {
    await printerExt.setBlob(on ? 1 : 0);
  } catch (e) {
    console.log(`${LOG} setBold: best-effort bold toggle failed, continuing —`, e);
  }
}

/** widthtimes/heigthtimes are multiplier *indices* (0=1x, 1=2x, 2=3x, 3=4x) on
 * the ESC/POS "select character size" command — 0 is normal size, not tiny.
 * Only heigthtimes is bumped below for "bigger font": widening characters
 * would roughly halve how many fit per line and break the row()-based
 * column math (sized for RECEIPT_WIDTH=32 at normal *width*), while taller
 * characters don't change how many fit on a line at all. */
function textOptions(heigthtimes = 0) {
  return { encoding: "GBK", codepage: 0, widthtimes: 0, heigthtimes, fonttype: 1 };
}

async function printLine(text: string, heigthtimes = 0): Promise<void> {
  await BluetoothEscposPrinter.printText(`${text}\n`, textOptions(heigthtimes));
}

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
    // --- Branding header (centered — real ESC/POS justification, not manual
    // space-padding, so it stays correct regardless of font size) ---
    await alignCenter();
    await setBold(true);
    await printLine(data.schoolName, 1);
    await setBold(false);
    await printLine(SCHOOL_ADDRESS);
    await printLine(`Tel: ${SCHOOL_PHONE}`);
    await printLine(SCHOOL_EMAIL);
    await printLine(DIVIDER);
    await printLine("PAYMENT RECEIPT", 1);
    await printLine(DIVIDER);

    // --- Payment details (left-aligned, taller text = "bigger font") ---
    await alignLeft();
    await printLine(`Receipt #: ${data.receiptId.slice(-8).toUpperCase()}`, 1);
    await printLine(`Date: ${formatReadableDate(data.occurredAt)}`, 1);
    await printLine(`Time: ${formatReadableTime(data.occurredAt)}`, 1);
    await printLine(`Student: ${data.studentName}`, 1);
    if (data.level) await printLine(`Level: ${data.level}`, 1);
    if (data.admissionNo != null) await printLine(`Admission #: ${data.admissionNo}`, 1);
    await printLine(DIVIDER);

    await printLine(`Category: ${data.category}`, 1);
    await printLine(row("Amount paid:", `$${data.amount.toFixed(2)}`), 1);
    if (data.discount != null && data.discount > 0) {
      await printLine(row("Discount:", `-$${data.discount.toFixed(2)}`), 1);
      await printLine(row("Net cash:", `$${(data.netAmount ?? data.amount - data.discount).toFixed(2)}`), 1);
    }
    if (data.note) await printLine(`Note: ${data.note}`, 1);
    if (data.balanceAfter != null) {
      await printLine(DIVIDER);
      await printLine(row("Balance after:", `$${data.balanceAfter.toFixed(2)}`), 1);
    }
    await printLine(DIVIDER);
    if (data.recordedBy) await printLine(`Recorded by: ${data.recordedBy}`);

    // --- Footer + verification QR (centered) ---
    await alignCenter();
    await printLine("Thank you for your payment!", 1);
    await printLine("");
    await printLine("Scan to verify this receipt");

    try {
      const verifyUrl = buildVerifyUrl(data.receiptId);
      console.log(`${LOG} printReceipt: printing verification QR for ${verifyUrl}`);
      await alignCenter();
      // Sized as large as the 58mm printable width allows (384 dots). A
      // literal 2.5x of the old 200 would be 500, but that overflows the
      // printable width and gets clipped/unscannable on this app's target
      // 58mm thermal printers — 360 is the largest 8-dot-aligned size that
      // still fits, ~1.8x the old size.
      await BluetoothEscposPrinter.printQRCode(verifyUrl, 360, BluetoothEscposPrinter.ERROR_CORRECTION.M);
    } catch (e) {
      // Best-effort/secondary — a printer that can't render a QR bitmap
      // shouldn't fail the whole receipt; every figure on it has already
      // printed by this point.
      console.error(`${LOG} printReceipt: QR code failed, continuing without it —`, e);
    }

    await printLine("");
    await printLine("");
    await BluetoothEscposPrinter.cutPaper();
    console.log(`${LOG} printReceipt: success`);
    return ok(undefined);
  } catch (e) {
    console.error(`${LOG} printReceipt: failed partway through:`, e);
    return err("PRINT_FAILED", "Printing failed partway through. Check the printer and try again.");
  }
}
