import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { connectPrinter, listPrinters, type PrinterDevice } from "@/lib/printer";

interface PrinterDevicePickerProps {
  visible: boolean;
  onClose: () => void;
  onConnected: (device: PrinterDevice) => void;
}

/** Bottom-sheet device picker: scans for paired/nearby Bluetooth printers and connects on tap. */
export function PrinterDevicePicker({ visible, onClose, onConnected }: PrinterDevicePickerProps) {
  const [devices, setDevices] = useState<PrinterDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingAddress, setConnectingAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    const result = await listPrinters();
    if (result.ok) {
      setDevices(result.data);
      if (result.data.length === 0) {
        setError("No Bluetooth printers found nearby. Make sure it's powered on, paired, and in range.");
      }
    } else {
      setError(result.error.message);
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    if (visible) {
      scan();
    } else {
      setDevices([]);
      setError(null);
      setConnectingAddress(null);
    }
  }, [visible, scan]);

  async function handleSelect(device: PrinterDevice) {
    setConnectingAddress(device.address);
    setError(null);
    const result = await connectPrinter(device.address);
    setConnectingAddress(null);
    if (result.ok) {
      onConnected(device);
    } else {
      setError(result.error.message);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[70%] rounded-t-2xl bg-white p-4 md:mx-auto md:w-full md:max-w-md md:rounded-2xl">
          <View className="mb-3 flex-row items-center justify-between">
            <Text variant="subheading">Select a printer</Text>
            <Button size="sm" variant="ghost" onPress={onClose}>
              Close
            </Button>
          </View>

          {error ? <ErrorState message={error} onRetry={scan} className="mb-3" /> : null}

          {scanning ? (
            <LoadingState label="Scanning for printers…" />
          ) : (
            <FlatList
              data={devices}
              keyExtractor={(d) => d.address}
              ItemSeparatorComponent={() => <Separator />}
              renderItem={({ item }) => (
                <Pressable
                  className="flex-row items-center justify-between py-3"
                  disabled={connectingAddress !== null}
                  onPress={() => handleSelect(item)}
                >
                  <View>
                    <Text className="font-medium">{item.name || "Unnamed device"}</Text>
                    <Text variant="muted">
                      {item.address}
                      {item.paired ? " · Paired" : ""}
                    </Text>
                  </View>
                  {connectingAddress === item.address ? <ActivityIndicator color="#0f172a" /> : null}
                </Pressable>
              )}
            />
          )}

          <Button className="mt-3" variant="secondary" loading={scanning} onPress={scan}>
            Scan again
          </Button>
        </View>
      </View>
    </Modal>
  );
}
