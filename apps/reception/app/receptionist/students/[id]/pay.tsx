import { useState } from "react";
import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MotiView } from "moti";
import { CreditCard, Wallet } from "lucide-react-native";
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
import { isBlank, requiredAmount } from "@/lib/validation";

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
  const [submitAttempted, setSubmitAttempted] = useState(false);

  if (!student || !id) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ErrorState message="Student not found in the local cache." />
      </View>
    );
  }

  const balance = student.feeBalance ?? 0;
  const parsedAmount = Number(amount);
  // requiredAmount catches empty/non-numeric text; a numeric-but-zero-or-
  // negative amount needs its own message since "0" parses fine but isn't
  // a valid payment.
  const amountError = requiredAmount(amount, "Amount") ?? (parsedAmount <= 0 ? "Amount must be greater than $0." : undefined);
  const isValid = !amountError;

  function handleSubmit() {
    setSubmitAttempted(true);
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
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 280 }}
      className="w-full flex-1 bg-white p-4 md:mx-auto md:max-w-md md:p-6 lg:max-w-lg"
    >
      <View className="mb-6 flex-row items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-gold-100">
          <Wallet size={18} color="#A37A1D" />
        </View>
        <View>
          <Text variant="subheading">{student.fullName}</Text>
          <Text variant="muted">
            Current balance{" "}
            <Text className={balance > 0 ? "font-body-semibold text-danger-700" : "font-body-semibold text-success-700"}>
              ${balance.toFixed(2)}
            </Text>
          </Text>
        </View>
      </View>

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
        {(submitAttempted || !isBlank(amount)) && amountError ? (
          <Text className="mt-1 text-xs font-body-medium text-danger-600">{amountError}</Text>
        ) : null}
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
        <CreditCard size={16} color="#fff" />
        <Text className="ml-2 font-body-semibold text-base text-white">Record payment</Text>
      </Button>
    </MotiView>
  );
}
