import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type PeriodKey = "today" | "week" | "month" | "all";

export const PERIOD_LABELS: Record<PeriodKey, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  all: "All Time",
};

/**
 * Resolves a PeriodKey into a concrete [from, to] window, anchored to now.
 * This is a rolling-window filter — separate from the existing per-Term
 * filtering elsewhere in the app:
 *  - "today" = last 24 hours (not "since local midnight"), per spec.
 *  - "week"  = last 7 days.
 *  - "month" = last 30 days.
 *  - "all"   = no bound (both null) — clears the filter.
 */
export function periodRange(key: PeriodKey, now: Date = new Date()): { from: Date | null; to: Date | null } {
  if (key === "all") return { from: null, to: null };
  const to = now;
  const from = new Date(now);
  if (key === "today") from.setDate(from.getDate() - 1);
  else if (key === "week") from.setDate(from.getDate() - 7);
  else if (key === "month") from.setDate(from.getDate() - 30);
  return { from, to };
}

export interface PeriodSelectorProps {
  value: PeriodKey;
  onChange: (key: PeriodKey) => void;
  className?: string;
}

/**
 * Today / This Week / This Month quick filter shown on the Dashboard,
 * Students, and Payments admin pages — deliberately separate from each
 * page's existing per-Term selector. "All Time" clears it back to whatever
 * the page shows by default.
 */
export function PeriodSelector({ value, onChange, className }: PeriodSelectorProps) {
  const keys: PeriodKey[] = ["today", "week", "month", "all"];
  return (
    <View className={cn("flex-row gap-2", className)}>
      {keys.map((key) => {
        const active = value === key;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            className={cn(
              "rounded-full px-3 py-1.5",
              active ? "bg-gold-600" : "bg-slate-100",
            )}
          >
            <Text className={cn("text-xs font-body-semibold", active ? "text-white" : "text-slate-600")}>
              {PERIOD_LABELS[key]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
