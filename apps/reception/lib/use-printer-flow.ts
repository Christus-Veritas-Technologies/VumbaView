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
export function usePrinterFlow() {
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [pendingData, setPendingData] = useState<ReceiptPrintData | null>(null);

  const doPrint = useCallback(async (data: ReceiptPrintData) => {
    setPrinting(true);
    setPrintError(null);
    try {
      const result = await printReceipt(data);
      if (!result.ok) {
        setPrintError(result.error.message);
        if (result.error.code === "NO_DEVICE_SELECTED" || result.error.code === "CONNECTION_FAILED") {
          setConnectedDevice(null);
        }
        return false;
      }
      return true;
    } finally {
      setPrinting(false);
    }
  }, []);

  /** Call from a row/button's onPress. Opens the device picker if nothing's connected yet. */
  const requestPrint = useCallback(
    (data: ReceiptPrintData) => {
      setPrintError(null);
      if (!isPrinterSupported()) {
        setPrintError("Bluetooth printing is only available on Android devices.");
        return;
      }
      if (!connectedDevice) {
        setPendingData(data);
        setPickerVisible(true);
        return;
      }
      void doPrint(data);
    },
    [connectedDevice, doPrint],
  );

  /** Wire directly to <PrinterDevicePicker onConnected={...}>. */
  const handleDeviceConnected = useCallback(
    (device: PrinterDevice) => {
      setConnectedDevice(device);
      setPickerVisible(false);
      if (pendingData) void doPrint(pendingData);
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
