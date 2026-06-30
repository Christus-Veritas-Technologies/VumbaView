import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { MotiView } from "moti";
import { CreditCard, Receipt, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import { LEVEL_LABELS, PAYMENT_CATEGORIES, type PaymentCategory } from "@/lib/types";
import { isBlank, requiredAmount } from "@/lib/validation";
import type { StudentCacheRow } from "@/lib/storage/db";

const CATEGORY_OPTIONS = PAYMENT_CATEGORIES.map((c) => ({
  label: c.charAt(0) + c.slice(1).toLowerCase(),
  value: c,
}));

export interface PaymentFormValues {
  category: PaymentCategory;
  /** Only set when category = "CUSTOM" — the specific label for this payment. */
  customLabel?: string;
  amount: number;
  discount?: number;
  note?: string;
}

export interface PaymentFormProps {
  student: StudentCacheRow;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (values: PaymentFormValues) => void;
}

/**
 * The actual "record a payment" form — category, amount, discount, note,
 * plus the balance summary card. When category = CUSTOM, an additional
 * "Payment type" field appears, showing previously-used custom labels as
 * quick-pick chips plus a free-text input for new ones.
 */
export function PaymentForm({ student, submitting = false, error, submitLabel = "Record payment", onSubmit }: PaymentFormProps) {
  const [category, setCategory] = useState<PaymentCategory>("FEES");
  const [customLabel, setCustomLabel] = useState("");
  const [savedCustomLabels, setSavedCustomLabels] = useState<string[]>([]);
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // Fetch previously-used CUSTOM payment labels so they appear as chips.
  useEffect(() => {
    api
      .get<string[]>("/payments/custom-categories")
      .then(setSavedCustomLabels)
      .catch(() => {/* offline — no chips, free-text only */});
  }, []);

  const balance = student.feeBalance ?? 0;
  const parsedAmount = Number(amount);
  const amountError = requiredAmount(amount, "Amount") ?? (parsedAmount <= 0 ? "Amount must be greater than $0." : undefined);

  const parsedDiscount = isBlank(discount) ? 0 : Number(discount);
  const discountError = isBlank(discount)
    ? undefined
    : Number.isNaN(parsedDiscount) || parsedDiscount < 0
      ? "Enter a valid discount amount."
      : !amountError && parsedDiscount > parsedAmount
        ? "Discount can't exceed the payment amount."
        : undefined;

  const customLabelError = category === "CUSTOM" && isBlank(customLabel)
    ? "Enter what type of payment this is."
    : undefined;

  const isValid = !amountError && !discountError && !customLabelError;
  const netAmount = Math.max(0, parsedAmount - (Number.isNaN(parsedDiscount) ? 0 : parsedDiscount));

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!isValid) return;
    onSubmit({
      category,
      customLabel: category === "CUSTOM" ? customLabel.trim() : undefined,
      amount: parsedAmount,
      discount: parsedDiscount > 0 ? parsedDiscount : undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      <View className="w-full flex-col gap-6 p-4 md:mx-auto md:max-w-3xl md:flex-row md:items-start md:p-8 lg:max-w-4xl">
        <View className="gap-4 md:w-72">
          <View className="flex-row items-center gap-3 rounded-2xl border border-gold-100 bg-gold-50 p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-gold-100">
              <Wallet size={20} color="#A37A1D" />
            </View>
            <View className="flex-1">
              <Text variant="subheading">{student.fullName}</Text>
              <Text variant="muted">{LEVEL_LABELS[student.level]}</Text>
            </View>
          </View>

          <View className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <Text variant="label" className="mb-1 text-slate-500">
              Current balance
            </Text>
            <Text className={cnBalance(balance)}>${balance.toFixed(2)}</Text>
            <Text variant="muted" className="mt-1">
              {balance > 0 ? "Outstanding fees for this term." : "Fully paid for this term."}
            </Text>
            {category === "FEES" && balance > 0 ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 self-start"
                onPress={() => setAmount(balance.toFixed(2))}
              >
                <Text className="font-body-semibold text-sm text-slate-700">Use full balance (${balance.toFixed(2)})</Text>
              </Button>
            ) : null}
          </View>

          {category !== "FEES" ? (
            <View className="flex-row items-start gap-2 rounded-2xl border border-slate-100 bg-white p-3">
              <Receipt size={16} color="#94a3b8" />
              <Text variant="muted" className="flex-1">
                {category === "UNIFORMS" ? "Uniform" : "Custom"} payments are logged for record-keeping only and
                don't affect the fee balance.
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-1 md:max-w-md">
          {error ? <ErrorState message={error} onRetry={handleSubmit} className="mb-4" /> : null}

          <View className="mb-4">
            <Label>Category</Label>
            <Select
              options={CATEGORY_OPTIONS}
              value={category}
              onValueChange={(v) => {
                setCategory(v as PaymentCategory);
                setCustomLabel("");
              }}
              placeholder="Select category"
            />
          </View>

          {/* Custom payment type — only shown when CUSTOM is selected */}
          {category === "CUSTOM" ? (
            <MotiView
              from={{ opacity: 0, translateY: -6 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 200 }}
              className="mb-4"
            >
              <Label className="mb-2">Payment type</Label>

              {/* Previously-used custom labels as chips */}
              {savedCustomLabels.length > 0 ? (
                <View className="mb-2 flex-row flex-wrap gap-2">
                  {savedCustomLabels.map((label) => (
                    <Pressable
                      key={label}
                      onPress={() => setCustomLabel(label)}
                      className={`rounded-full border px-3 py-1.5 ${
                        customLabel === label
                          ? "border-gold-500 bg-gold-100"
                          : "border-slate-200 bg-slate-50 active:bg-slate-100"
                      }`}
                    >
                      <Text
                        className={`text-xs ${customLabel === label ? "font-body-semibold text-gold-800" : "font-body text-slate-600"}`}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <Input
                value={customLabel}
                onChangeText={setCustomLabel}
                placeholder="e.g. Stationery fee, Sport kit..."
                autoFocus={savedCustomLabels.length === 0}
              />
              {(submitAttempted && customLabelError) ? (
                <Text className="mt-1 text-xs font-body-medium text-danger-600">{customLabelError}</Text>
              ) : null}
            </MotiView>
          ) : null}

          <View className="mb-4">
            <Label>Amount (USD)</Label>
            <Input value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
            {(submitAttempted || !isBlank(amount)) && amountError ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{amountError}</Text>
            ) : null}
          </View>

          <View className="mb-4">
            <Label>Discount (optional)</Label>
            <Input value={discount} onChangeText={setDiscount} placeholder="0.00" keyboardType="decimal-pad" />
            {(submitAttempted || !isBlank(discount)) && discountError ? (
              <Text className="mt-1 text-xs font-body-medium text-danger-600">{discountError}</Text>
            ) : !isBlank(discount) && !discountError ? (
              <Text variant="muted" className="mt-1 text-xs">
                Balance is still credited ${(Number.isNaN(parsedAmount) ? 0 : parsedAmount).toFixed(2)} — only $
                {netAmount.toFixed(2)} counts as cash collected.
              </Text>
            ) : null}
          </View>

          <View className="mb-6">
            <Label>Note (optional)</Label>
            <Input value={note} onChangeText={setNote} placeholder="e.g. Term 1 deposit" />
          </View>

          <Button disabled={!isValid || submitting} loading={submitting} onPress={handleSubmit}>
            <CreditCard size={16} color="#fff" />
            <Text className="ml-2 font-body-semibold text-base text-white">{submitLabel}</Text>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

function cnBalance(balance: number) {
  return balance > 0
    ? "font-heading-semibold text-2xl text-danger-700"
    : "font-heading-semibold text-2xl text-success-700";
}
