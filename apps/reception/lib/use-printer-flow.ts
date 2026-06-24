import { useCallback, useState } from "react";
import { isPrinterSupported, printReceipt, type PrinterDevice, type ReceiptPrintData } from "@/lib/printer";

/**
 * Shared print-button state machine, sitting on top of the single-source
 * printing functions in lib/printer.ts. Any screen with a "print receipt"
 * action (the receipt screen, the admin payments table, anywhere else this
 * grows to) should drive its button off this hook instead of re-deriving its
 * own picker-visible/connected-device/printing/error state — that keeps the
 * print *flow*, not just the print mechanics, defined in one place.
 */
const LOG = "[printer-flow]";

export function usePrinterFlow() {
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<ReceiptPrintData | null>(null);

  const doPrint = useCallback(async (data: ReceiptPrintData) => {
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
      return true;
    } finally {
      setPrinting(false);
    }
  }, []);

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
        console.log(`${LOG} requestPrint: no device connected, opening picker and queuing print`);
        setPendingData(data);
        setPickerVisible(true);
        return;
      }
      console.log(`${LOG} requestPrint: device already connected, printing immediately`);
      void doPrint(data);
    },
    [connectedDevice, doPrint],
  );

  /** Wire directly to <PrinterDevicePicker onConnected={...}>. */
  const handleDeviceConnected = useCallback(
    (device: PrinterDevice) => {
      console.log(`${LOG} handleDeviceConnected: connected to ${device.name || "unnamed"} (${device.address})`);
      setConnectedDevice(device);
      setPickerVisible(false);
      if (pendingData) {
        console.log(`${LOG} handleDeviceConnected: printing queued receipt ${pendingData.receiptId}`);
        void doPrint(pendingData);
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
