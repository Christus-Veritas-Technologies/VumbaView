import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { getStudentCache } from "@/lib/storage/db";
import { queueRecordPayment } from "@/lib/sync";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { PAYMENT_CATEGORIES, type PaymentCategory } from "@/lib/types";

const CATEGORY_OPTIONS = PAYMENT_CATEGORIES.map((c) => ({
  label: c.charAt(0) + c.slice(1).toLowerCase(),
  value: c,
}));

export default function RecordPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const student = id ? getStudentCache(id) : null;
  const [category, setCategory] = useState<PaymentCategory>("FEES");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!student || !id) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ErrorState message="Student not found in the local cache." />
      </View>
    );
  }

  const parsedAmount = Number(amount);
  const isValid = amount.trim().length > 0 && Number.isFinite(parsedAmount) && parsedAmount > 0;

  function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      // queueRecordPayment writes to the local cache and enqueues the sync —
      // it returns the local id immediately so the receipt can be shown
      // before (or entirely without) a server round-trip.
      const localId = queueRecordPayment(
        { studentId: student.id, category, amount: parsedAmount, note: note.trim() || undefined },
        staff?.id ?? null,
      );
      useSyncStore.getState().runSync();
      router.replace(`/receipt/${localId}`);
    } catch {
      setError("Couldn't record this payment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="w-full flex-1 bg-white p-4 md:mx-auto md:max-w-md md:p-6 lg:max-w-lg">
      <Text variant="subheading" className="mb-1">
        {student.fullName}
      </Text>
      <Text variant="muted" className="mb-6">
        Current balance: ${(student.feeBalance ?? 0).toFixed(2)}
      </Text>

      {error ? <ErrorState message={error} onRetry={handleSubmit} className="mb-4" /> : null}

      <View className="mb-4">
        <Label>Category</Label>
        <Select
          options={CATEGORY_OPTIONS}
          value={category}
          onValueChange={(v) => setCategory(v as PaymentCategory)}
          placeholder="Select category"
        />
      </View>

      <View className="mb-4">
        <Label>Amount (USD)</Label>
        <Input value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
      </View>

      <View className="mb-6">
        <Label>Note (optional)</Label>
        <Input value={note} onChangeText={setNote} placeholder="e.g. Term 1 deposit" />
      </View>

      {category !== "FEES" ? (
        <Text variant="muted" className="mb-4">
          {category === "UNIFORMS" ? "Uniform" : "Custom"} payments are logged for record-keeping only and don't
          affect the fee balance.
        </Text>
      ) : null}

      <Button disabled={!isValid} loading={submitting} onPress={handleSubmit}>
        Record payment
      </Button>
    </View>
  );
}
