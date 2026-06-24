import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { CheckCircle2, Printer as PrinterIcon, Receipt as ReceiptIcon } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PrinterDevicePicker } from "@/components/printer-device-picker";
import { BrandMark } from "@/components/brand-mark";
import {
  getPaymentCache,
  getStudentCache,
  type PaymentCacheRow,
  type StudentCacheRow,
} from "@/lib/storage/db";
import { connectPrinter, getConnectedPrinter, isPrinterSupported, printReceipt, type PrinterDevice } from "@/lib/printer";
import { getLastPrinter, setLastPrinter } from "@/lib/storage/printer";
import { useAuthStore } from "@/store/auth-store";
import { LEVEL_LABELS } from "@/lib/types";

const SCHOOL_NAME = "VumbaView Academy";

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);

  const [payment, setPayment] = useState<PaymentCacheRow | null>(null);
  const [student, setStudent] = useState<StudentCacheRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<PrinterDevice | null>(null);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState<string | null>(null);
  const [printed, setPrinted] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    try {
      const p = getPaymentCache(id);
      setPayment(p);
      setStudent(p ? getStudentCache(p.studentId) : null);
      setLoadError(p ? null : "Receipt not found in the local cache.");
    } catch {
      setLoadError("Couldn't load this receipt from the local cache.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isPrinterSupported()) return;
    getConnectedPrinter().then((d) => {
      console.log("[receipt] checked for already-connected printer on mount:", d ? `${d.name || "unnamed"} (${d.address})` : "none");
      if (d) setConnectedDevice({ ...d, paired: true });
    });
  }, []);

  /** device is the device actually used for this print, passed explicitly so
   * a just-connected device (not yet reflected in connectedDevice state) is
   * still recorded as the last-used printer. */
  const doPrint = useCallback(
    async (device?: PrinterDevice | null) => {
      if (!payment || !student) {
        console.log("[receipt] doPrint: skipped — payment or student not loaded yet");
        return;
      }
      console.log(`[receipt] doPrint: start for payment ${payment.id}, student "${student.fullName}"`);
      setPrinting(true);
      setPrintError(null);
      try {
        const result = await printReceipt({
          schoolName: SCHOOL_NAME,
          receiptId: payment.id,
          occurredAt: payment.occurredAt ?? payment.createdAt ?? new Date().toISOString(),
          studentName: student.fullName,
          level: LEVEL_LABELS[student.level],
          admissionNo: student.admissionNo,
          category: payment.category,
          amount: payment.amount,
          discount: payment.discount ?? 0,
          netAmount: payment.amount - (payment.discount ?? 0),
          note: payment.note,
          balanceAfter: payment.category === "FEES" ? student.feeBalance : null,
          recordedBy: staff && staff.id === payment.recordedById ? staff.username : null,
        });
        if (result.ok) {
          console.log(`[receipt] doPrint: success for payment ${payment.id}`);
          setPrinted(true);
          const printedVia = device ?? connectedDevice;
          if (printedVia) {
            console.log(`[receipt] doPrint: saving "${printedVia.name || printedVia.address}" as last-used printer`);
            void setLastPrinter({ address: printedVia.address, name: printedVia.name ?? "" });
          }
        } else {
          console.error(`[receipt] doPrint: printReceipt failed for payment ${payment.id} —`, result.error);
          setPrintError(result.error.message);
          if (result.error.code === "NO_DEVICE_SELECTED" || result.error.code === "CONNECTION_FAILED") {
            console.log(`[receipt] doPrint: clearing connectedDevice after ${result.error.code}`);
            setConnectedDevice(null);
          }
        }
      } finally {
        setPrinting(false);
      }
    },
    [payment, student, staff, connectedDevice],
  );

  /** Tries to silently reconnect to a previously-saved printer; falls back to the picker on failure. */
  async function reconnectSaved(saved: { address: string; name: string }) {
    console.log(`[receipt] reconnectSaved: trying "${saved.name || saved.address}" (${saved.address})`);
    const result = await connectPrinter(saved.address, saved.name);
    if (!result.ok) {
      console.error("[receipt] reconnectSaved: failed —", result.error);
      setPrintError(`Couldn't reconnect to "${saved.name || saved.address}". Choose a printer below.`);
      setPickerVisible(true);
      return;
    }
    const device: PrinterDevice = { address: saved.address, name: saved.name, paired: true };
    console.log("[receipt] reconnectSaved: reconnected, printing");
    setConnectedDevice(device);
    void doPrint(device);
  }

  async function handlePrintPress() {
    console.log("[receipt] handlePrintPress: tapped, connectedDevice =", connectedDevice?.address ?? "none");
    setPrintError(null);
    if (!isPrinterSupported()) {
      console.log("[receipt] handlePrintPress: unsupported platform, aborting");
      setPrintError("Bluetooth printing is only available on Android devices.");
      return;
    }
    if (connectedDevice) {
      void doPrint(connectedDevice);
      return;
    }
    const saved = await getLastPrinter();
    if (!saved) {
      console.log("[receipt] handlePrintPress: no device connected and no saved printer, opening picker");
      setPickerVisible(true);
      return;
    }
    console.log(`[receipt] handlePrintPress: found saved printer "${saved.name || saved.address}", asking`);
    Alert.alert("Use last printer?", `Print using "${saved.name || saved.address}" again?`, [
      {
        text: "Choose a different printer",
        style: "cancel",
        onPress: () => setPickerVisible(true),
      },
      {
        text: "Use this printer",
        onPress: () => void reconnectSaved(saved),
      },
    ]);
  }

  function handleDeviceConnected(device: PrinterDevice) {
    console.log(`[receipt] handleDeviceConnected: connected to ${device.name || "unnamed"} (${device.address})`);
    setConnectedDevice(device);
    setPickerVisible(false);
    void doPrint(device);
  }

  if (!staff) {
    return <Redirect href="/login" />;
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <LoadingState label="Loading receipt…" />
      </View>
    );
  }

  if (!payment || !student) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ErrorState message={loadError ?? "Receipt not found."} onRetry={load} />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
        className="w-full p-4 md:mx-auto md:max-w-2xl md:p-6 lg:max-w-3xl"
      >
        <View className="mb-4 flex-row items-center gap-3">
          <MotiView
            from={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 80 }}
            className="h-12 w-12 items-center justify-center rounded-full bg-success-100"
          >
            <CheckCircle2 size={22} color="#047857" />
          </MotiView>
          <View>
            <Text variant="heading">Receipt</Text>
            <BrandMark size="xs" className="mt-0.5" />
            <Text variant="muted">Payment recorded successfully.</Text>
          </View>
        </View>

        <Card className="mb-4">
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <ReceiptIcon size={16} color="#A37A1D" />
              <CardTitle>{student.fullName}</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="muted">Category</Text>
              <Text>{payment.category}</Text>
            </View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="muted">Amount</Text>
              <Text className="font-body-semibold">${payment.amount.toFixed(2)}</Text>
            </View>
            {payment.discount > 0 ? (
              <>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="muted">Discount</Text>
                  <Text className="font-body-semibold text-gold-700">-${payment.discount.toFixed(2)}</Text>
                </View>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="muted">Net cash collected</Text>
                  <Text className="font-body-semibold">${(payment.amount - payment.discount).toFixed(2)}</Text>
                </View>
              </>
            ) : null}
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="muted">Date</Text>
              <Text>{payment.occurredAt ? new Date(payment.occurredAt).toLocaleString() : "—"}</Text>
            </View>
            {payment.note ? (
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="muted">Note</Text>
                <Text>{payment.note}</Text>
              </View>
            ) : null}
            {payment.category === "FEES" ? (
              <>
                <Separator className="my-2" />
                <View className="flex-row items-center justify-between">
                  <Text variant="muted">Balance after</Text>
                  <Text className="font-body-semibold">${(student.feeBalance ?? 0).toFixed(2)}</Text>
                </View>
              </>
            ) : null}
          </CardContent>
        </Card>

        {printError ? (
          <ErrorState
            message={printError}
            onRetry={connectedDevice ? () => void doPrint(connectedDevice) : handlePrintPress}
            className="mb-4"
          />
        ) : null}
        {printed ? (
          <Card className="mb-4 border-success-200 bg-success-50">
            <CardContent>
              <View className="flex-row items-center gap-2">
                <CheckCircle2 size={16} color="#047857" />
                <Text className="font-body-medium text-success-700">Receipt sent to the printer.</Text>
              </View>
            </CardContent>
          </Card>
        ) : null}

        <Button loading={printing} onPress={handlePrintPress} className="mb-3">
          <PrinterIcon size={16} color="#fff" />
          <Text className="ml-2 font-body-semibold text-base text-white">
            {connectedDevice ? `Print receipt (${connectedDevice.name || "printer"})` : "Print receipt"}
          </Text>
        </Button>

        <Button variant="secondary" onPress={() => router.replace(`/receptionist/students/${student.id}`)}>
          <CheckCircle2 size={16} color="#0f172a" />
          <Text className="ml-2 font-body-semibold text-base text-slate-900">Done</Text>
        </Button>
      </MotiView>

      <PrinterDevicePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConnected={handleDeviceConnected}
      />
    </ScrollView>
  );
}
