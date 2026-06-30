import { useState } from "react";
import { useRouter } from "expo-router";
import { ExpenseForm, type ExpenseFormValues } from "@/components/expense-form";
import { queueRecordExpense } from "@/lib/sync";
import { useSyncStore } from "@/store/sync-store";

export default function RecordExpenseScreen() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(values: ExpenseFormValues) {
    setSubmitting(true);
    setError(null);
    try {
      queueRecordExpense(values);
      // Kick off a background sync so the expense lands on the server
      // as soon as connectivity allows — without blocking the UI.
      useSyncStore.getState().runSync();
      router.back();
    } catch {
      setError("Couldn't queue this expense. Please try again.");
      setSubmitting(false);
    }
  }

  return <ExpenseForm onSubmit={handleSubmit} submitting={submitting} error={error} />;
}
