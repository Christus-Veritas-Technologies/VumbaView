import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { MotiView } from "moti";
import { PenLine, Plus } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import { BUILTIN_EXPENSE_CATEGORIES } from "@/lib/types";
import { isBlank, requiredAmount } from "@/lib/validation";

export interface ExpenseFormValues {
  category: string;
  amount: number;
  note?: string;
  occurredAt?: string;
}

export interface ExpenseFormProps {
  onSubmit: (values: ExpenseFormValues) => void;
  submitting?: boolean;
  error?: string | null;
}

/**
 * Category chip picker: built-in presets + previously-used custom labels
 * (fetched from server) + a "+ Custom" chip that reveals a free-text input.
 * Selecting any chip sets the category; typing a custom label and confirming
 * sets the category to whatever the user typed.
 */
export function ExpenseForm({ onSubmit, submitting = false, error }: ExpenseFormProps) {
  const [category, setCategory] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [allCategories, setAllCategories] = useState<string[]>([...BUILTIN_EXPENSE_CATEGORIES]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api
      .get<string[]>("/expenses/categories")
      .then(setAllCategories)
      .catch(() => {
        /* keep built-ins on failure */
      })
      .finally(() => setLoadingCategories(false));
  }, []);

  function selectPreset(label: string) {
    setCategory(label);
    setCustomMode(false);
    setCustomText("");
    setFieldErrors((e) => ({ ...e, category: "" }));
  }

  function confirmCustom() {
    if (customText.trim()) {
      setCategory(customText.trim());
      setCustomMode(false);
      setFieldErrors((e) => ({ ...e, category: "" }));
    }
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    const effectiveCategory = customMode ? customText.trim() : category;
    if (isBlank(effectiveCategory)) errors.category = "Choose or type a category";
    const amountError = requiredAmount(amount);
    if (amountError) errors.amount = amountError;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit() {
    const effectiveCategory = customMode ? customText.trim() : category;
    if (!validate()) return;
    onSubmit({
      category: effectiveCategory,
      amount: parseFloat(amount),
      note: note.trim() || undefined,
    });
  }

  return (
    <ScrollView className="flex-1 bg-white" contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      {/* Category picker */}
      <View className="mb-5">
        <Label className="mb-2">Category</Label>

        {loadingCategories ? (
          <ActivityIndicator color="#A37A1D" className="my-2" />
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {allCategories.map((label) => {
              const selected = !customMode && category === label;
              return (
                <Pressable
                  key={label}
                  onPress={() => selectPreset(label)}
                  className={`rounded-full border px-4 py-2 ${
                    selected
                      ? "border-gold-500 bg-gold-100"
                      : "border-slate-200 bg-slate-50 active:bg-slate-100"
                  }`}
                >
                  <Text
                    className={`text-sm ${selected ? "font-body-semibold text-gold-800" : "font-body text-slate-700"}`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Custom chip */}
            <Pressable
              onPress={() => {
                setCustomMode(true);
                setCategory("");
              }}
              className={`flex-row items-center gap-1 rounded-full border px-4 py-2 ${
                customMode
                  ? "border-violet-400 bg-violet-50"
                  : "border-dashed border-slate-300 bg-white active:bg-slate-50"
              }`}
            >
              <Plus size={14} color={customMode ? "#7c3aed" : "#94a3b8"} />
              <Text className={`text-sm ${customMode ? "font-body-semibold text-violet-700" : "font-body text-slate-500"}`}>
                Custom
              </Text>
            </Pressable>
          </View>
        )}

        {customMode && (
          <MotiView
            from={{ opacity: 0, translateY: -4 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 180 }}
            className="mt-3 flex-row items-center gap-2"
          >
            <Input
              value={customText}
              onChangeText={setCustomText}
              placeholder="e.g. Office supplies, Repairs..."
              autoFocus
              className="flex-1"
              onSubmitEditing={confirmCustom}
              returnKeyType="done"
            />
            <Pressable
              onPress={confirmCustom}
              className="h-11 items-center justify-center rounded-lg bg-violet-100 px-3 active:bg-violet-200"
            >
              <PenLine size={18} color="#7c3aed" />
            </Pressable>
          </MotiView>
        )}

        {category && !customMode ? (
          <Text className="mt-2 text-xs text-gold-700">
            Selected: <Text className="font-body-semibold">{category}</Text>
          </Text>
        ) : null}

        {fieldErrors.category ? (
          <Text className="mt-1 text-xs text-danger-600">{fieldErrors.category}</Text>
        ) : null}
      </View>

      {/* Amount */}
      <View className="mb-4">
        <Label className="mb-1">Amount ($)</Label>
        <Input
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {fieldErrors.amount ? (
          <Text className="mt-1 text-xs text-danger-600">{fieldErrors.amount}</Text>
        ) : null}
      </View>

      {/* Note (optional) */}
      <View className="mb-6">
        <Label className="mb-1">Note (optional)</Label>
        <Input
          value={note}
          onChangeText={setNote}
          placeholder="Any additional details..."
          multiline
          numberOfLines={2}
          className="h-20 pt-2"
          style={{ textAlignVertical: "top" }}
        />
      </View>

      {error ? <ErrorState message={error} className="mb-4" /> : null}

      <Button onPress={handleSubmit} loading={submitting} disabled={submitting}>
        <Text className="font-body-semibold text-base text-white">
          {submitting ? "Recording…" : "Record Expense"}
        </Text>
      </Button>
    </ScrollView>
  );
}
