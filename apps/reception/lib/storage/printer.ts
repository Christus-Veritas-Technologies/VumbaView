import * as SecureStore from "expo-secure-store";

const LAST_PRINTER_KEY = "vva_reception_last_printer";

export interface SavedPrinter {
  address: string;
  name: string;
}

/**
 * Remembers the last Bluetooth printer that successfully printed a receipt,
 * so next time we can ask "use this printer again?" instead of forcing a
 * fresh scan every time. Same SecureStore pattern as lib/storage/token.ts.
 */
export async function getLastPrinter(): Promise<SavedPrinter | null> {
  const raw = await SecureStore.getItemAsync(LAST_PRINTER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as SavedPrinter;
  } catch {
    return null;
  }
}

export async function setLastPrinter(device: SavedPrinter): Promise<void> {
  await SecureStore.setItemAsync(LAST_PRINTER_KEY, JSON.stringify(device));
}

export async function clearLastPrinter(): Promise<void> {
  await SecureStore.deleteItemAsync(LAST_PRINTER_KEY);
}
