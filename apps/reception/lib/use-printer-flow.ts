import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { connectPrinter, isPrinterSupported, printReceipt, type PrinterDevice, type ReceiptPrintData } from "@/lib/printer";
import { getLastPrinter, setLastPrinter, type SavedPrinter } from "@/lib/storage/printer";

/**
 * Shared print-button state machine, sitting on top of the single-source
 * printing functions in lib/printer.ts. Any screen with a "print receipt"
 * action (the receipt screen, the admin payments table, anywhere else this
 * grows to) should drive its button off this hook instead of re-deriving its
 * own picker-visible/connected-device/printing/error state — that keeps the
 * print *flow*, not just the print mechanics, defined in one place.
 *
 * Also remembers the last printer that successfully printed (see
 * lib/storage/printer.ts) and offers to reconnect to it directly instead of
 * forcing a fresh Bluetooth scan every single time.
 */
const LOG = "[printer-flow]";

export function usePrinterFlow() {
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<ReceiptPrintData | null>(null);

  /** device is the device actually used for this print, passed explicitly so
   * we don't depend on connectedDevice React state, which may not have
   * re-rendered yet right after a fresh connect (see call sites below). */
  const doPrint = useCallback(async (data: ReceiptPrintData, device: PrinterDevice | null) => {
    console.log(`${LOG} doPrint: start for receipt ${data.receiptId}`);
    setPrinting(true);
    setPrintError(null);
    try {
      const result = await printReceipt(data);
      if (!result.ok) {
        console.error(`${LOG} doPrint: printReceipt failed —`, result.error);
        setPrintError(result.error.message);
        if (result.error.code === "NO_DEVICE_SELECTED" || result.error.code === "CONNECTION_FAILED") {
          console.log(`${LOG} doPrint: clearing connectedDevice after ${result.error.code}`);
          setConnectedDevice(null);
        }
        return false;
      }
      console.log(`${LOG} doPrint: success for receipt ${data.receiptId}`);
      if (device) {
        console.log(`${LOG} doPrint: saving "${device.name || device.address}" as last-used printer`);
        void setLastPrinter({ address: device.address, name: device.name ?? "" });
      }
      return true;
    } finally {
      setPrinting(false);
    }
  }, []);

  /** Tries to silently reconnect to a previously-saved printer; falls back to the picker on failure. */
  const reconnectSaved = useCallback(
    async (saved: SavedPrinter, data: ReceiptPrintData) => {
      console.log(`${LOG} reconnectSaved: trying "${saved.name || saved.address}" (${saved.address})`);
      const result = await connectPrinter(saved.address, saved.name);
      if (!result.ok) {
        console.error(`${LOG} reconnectSaved: failed —`, result.error);
        setPrintError(`Couldn't reconnect to "${saved.name || saved.address}". Choose a printer below.`);
        setPickerVisible(true);
        return;
      }
      const device: PrinterDevice = { address: saved.address, name: saved.name, paired: true };
      console.log(`${LOG} reconnectSaved: reconnected, printing`);
      setConnectedDevice(device);
      void doPrint(data, device);
    },
    [doPrint],
  );

  /** Asks "use this printer again?" if we have one saved, otherwise opens the picker. */
  const offerSavedOrOpenPicker = useCallback(
    async (data: ReceiptPrintData) => {
      const saved = await getLastPrinter();
      if (!saved) {
        console.log(`${LOG} offerSavedOrOpenPicker: no saved printer, opening picker`);
        setPickerVisible(true);
        return;
      }
      console.log(`${LOG} offerSavedOrOpenPicker: found saved printer "${saved.name || saved.address}", asking`);
      Alert.alert("Use last printer?", `Print using "${saved.name || saved.address}" again?`, [
        {
          text: "Choose a different printer",
          style: "cancel",
          onPress: () => setPickerVisible(true),
        },
        {
          text: "Use this printer",
          onPress: () => void reconnectSaved(saved, data),
        },
      ]);
    },
    [reconnectSaved],
  );

  /** Call from a row/button's onPress. Opens the device picker if nothing's connected yet. */
  const requestPrint = useCallback(
    (data: ReceiptPrintData) => {
      console.log(`${LOG} requestPrint: receipt ${data.receiptId}, connectedDevice =`, connectedDevice?.address ?? "none");
      setPrintError(null);
      if (!isPrinterSupported()) {
        console.log(`${LOG} requestPrint: unsupported platform, aborting`);
        setPrintError("Bluetooth printing is only available on Android devices.");
        return;
      }
      if (!connectedDevice) {
        console.log(`${LOG} requestPrint: no device connected, checking for a saved printer`);
        setPendingData(data);
        void offerSavedOrOpenPicker(data);
        return;
      }
      console.log(`${LOG} requestPrint: device already connected, printing immediately`);
      void doPrint(data, connectedDevice);
    },
    [connectedDevice, doPrint, offerSavedOrOpenPicker],
  );

  /** Wire directly to <PrinterDevicePicker onConnected={...}>. */
  const handleDeviceConnected = useCallback(
    (device: PrinterDevice) => {
      console.log(`${LOG} handleDeviceConnected: connected to ${device.name || "unnamed"} (${device.address})`);
      setConnectedDevice(device);
      setPickerVisible(false);
      if (pendingData) {
        console.log(`${LOG} handleDeviceConnected: printing queued receipt ${pendingData.receiptId}`);
        void doPrint(pendingData, device);
      } else {
        console.log(`${LOG} handleDeviceConnected: no queued print, device picked from settings`);
      }
    },
    [pendingData, doPrint],
  );

  return {
    connectedDevice,
    pickerVisible,
    printing,
    printError,
    closePicker: () => setPickerVisible(false),
    requestPrint,
    handleDeviceConnected,
  };
}
