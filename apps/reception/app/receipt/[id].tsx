import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
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
import {
  getPaymentCache,
  getStudentCache,
  type PaymentCacheRow,
  type StudentCacheRow,
} from "@/lib/storage/db";
import { getConnectedPrinter, isPrinterSupported, printReceipt, type PrinterDevice } from "@/lib/printer";
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
      if (d) setConnectedDevice({ ...d, paired: true });
    });
  }, []);

  const doPrint = useCallback(async () => {
    if (!payment || !student) return;
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
        note: payment.note,
        balanceAfter: payment.category === "FEES" ? student.feeBalance : null,
        recordedBy: staff && staff.id === payment.recordedById ? staff.username : null,
      });
      if (result.ok) {
        setPrinted(true);
      } else {
        setPrintError(result.error.message);
        if (result.error.code === "NO_DEVICE_SELECTED" || result.error.code === "CONNECTION_FAILED") {
          setConnectedDevice(null);
        }
      }
    } finally {
      setPrinting(false);
    }
  }, [payment, student, staff]);

  function handlePrintPress() {
    setPrintError(null);
    if (!isPrinterSupported()) {
      setPrintError("Bluetooth printing is only available on Android devices.");
      return;
    }
    if (!connectedDevice) {
      setPickerVisible(true);
      return;
    }
    doPrint();
  }

  function handleDeviceConnected(device: PrinterDevice) {
    setConnectedDevice(device);
    setPickerVisible(false);
    doPrint();
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
          <ErrorState message={printError} onRetry={connectedDevice ? doPrint : handlePrintPress} className="mb-4" />
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
