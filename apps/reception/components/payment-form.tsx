import { useState } from "react";
import { ScrollView, View } from "react-native";
import { CreditCard, Receipt, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LEVEL_LABELS, PAYMENT_CATEGORIES, type PaymentCategory } from "@/lib/types";
import { isBlank, requiredAmount } from "@/lib/validation";
import type { StudentCacheRow } from "@/lib/storage/db";

const CATEGORY_OPTIONS = PAYMENT_CATEGORIES.map((c) => ({
  label: c.charAt(0) + c.slice(1).toLowerCase(),
  value: c,
}));

export interface PaymentFormValues {
  category: PaymentCategory;
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
 * plus the balance summary card. Factored out of students/[id]/pay.tsx so
 * the *same* validated form can be reached two ways: from a known student's
 * detail page (students/[id]/pay.tsx), and from the standalone Payments-tab
 * "new payment" flow (payments/new/[studentId].tsx), which picks the student
 * first via a dedicated picker screen. Each call site owns its own submit
 * handling (queueRecordPayment + navigation) and decides whether to wrap
 * this in <SheetScreen> — see the two route files for why that differs.
 */
export function PaymentForm({ student, submitting = false, error, submitLabel = "Record payment", onSubmit }: PaymentFormProps) {
  const [category, setCategory] = useState<PaymentCategory>("FEES");
  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [note, setNote] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const balance = student.feeBalance ?? 0;
  const parsedAmount = Number(amount);
  // requiredAmount catches empty/non-numeric text; a numeric-but-zero-or-
  // negative amount needs its own message since "0" parses fine but isn't
  // a valid payment.
  const amountError = requiredAmount(amount, "Amount") ?? (parsedAmount <= 0 ? "Amount must be greater than $0." : undefined);

  // Discount is optional — blank means $0. Net cash, full credit: the
  // balance is still credited the full amount; only (amount - discount)
  // counts as cash collected, so discount can never exceed the amount.
  const parsedDiscount = isBlank(discount) ? 0 : Number(discount);
  const discountError = isBlank(discount)
    ? undefined
    : Number.isNaN(parsedDiscount) || parsedDiscount < 0
      ? "Enter a valid discount amount."
      : !amountError && parsedDiscount > parsedAmount
        ? "Discount can't exceed the payment amount."
        : undefined;

  const isValid = !amountError && !discountError;
  const netAmount = Math.max(0, parsedAmount - (Number.isNaN(parsedDiscount) ? 0 : parsedDiscount));

  function handleSubmit() {
    setSubmitAttempted(true);
    if (!isValid) return;
    onSubmit({
      category,
      amount: parsedAmount,
      discount: parsedDiscount > 0 ? parsedDiscount : undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
      {/* Phone: summary stacked above the form. Tablet/desktop: the
          summary becomes a left-hand column so the sheet actually uses
          the extra width instead of just centering a narrow form on it. */}
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
