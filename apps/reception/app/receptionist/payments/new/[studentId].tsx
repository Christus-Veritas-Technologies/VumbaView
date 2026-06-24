import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ErrorState } from "@/components/ui/error-state";
import { PaymentForm, type PaymentFormValues } from "@/components/payment-form";
import { getStudentCache } from "@/lib/storage/db";
import { queueRecordPayment } from "@/lib/sync";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";

/**
 * Step 2 of the Payments-tab "new payment" flow, reached after picking a
 * student in new/index.tsx. Renders the exact same <PaymentForm> as
 * students/[id]/pay.tsx and submits identically — the only difference is
 * how the student was found (route param name) and that this screen isn't
 * its own modal (it's pushed inside the sheet new/index.tsx already opened,
 * so it doesn't get its own <SheetScreen> chrome — see payments/_layout.tsx).
 */
export default function NewPaymentForStudentScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const student = studentId ? getStudentCache(studentId) : null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student || !studentId) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ErrorState message="Student not found in the local cache." />
      </View>
    );
  }

  function handleSubmit(values: PaymentFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      const localId = queueRecordPayment({ studentId: student.id, ...values }, staff?.id ?? null);
      useSyncStore.getState().runSync();
      router.replace(`/receipt/${localId}`);
    } catch {
      setError("Couldn't record this payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return <PaymentForm student={student} submitting={submitting} error={error} onSubmit={handleSubmit} />;
}
