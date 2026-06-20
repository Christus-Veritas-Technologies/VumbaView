import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
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

const SCHOOL_NAME = "VumbaView School";

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
      <View className="w-full p-4 md:mx-auto md:max-w-2xl md:p-6 lg:max-w-3xl">
        <Text variant="heading" className="mb-1">
          Receipt
        </Text>
        <Text variant="muted" className="mb-4">
          Payment recorded successfully.
        </Text>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{student.fullName}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="muted">Category</Text>
              <Text>{payment.category}</Text>
            </View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text variant="muted">Amount</Text>
              <Text className="font-semibold">${payment.amount.toFixed(2)}</Text>
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
                  <Text className="font-semibold">${(student.feeBalance ?? 0).toFixed(2)}</Text>
                </View>
              </>
            ) : null}
          </CardContent>
        </Card>

        {printError ? (
          <ErrorState message={printError} onRetry={connectedDevice ? doPrint : handlePrintPress} className="mb-4" />
        ) : null}
        {printed ? (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardContent>
              <Text className="text-green-700">Receipt sent to the printer.</Text>
            </CardContent>
          </Card>
        ) : null}

        <Button loading={printing} onPress={handlePrintPress} className="mb-3">
          {connectedDevice ? `Print receipt (${connectedDevice.name || "printer"})` : "Print receipt"}
        </Button>

        <Button variant="secondary" onPress={() => router.replace(`/receptionist/students/${student.id}`)}>
          Done
        </Button>
      </View>

      <PrinterDevicePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onConnected={handleDeviceConnected}
      />
    </ScrollView>
  );
}
