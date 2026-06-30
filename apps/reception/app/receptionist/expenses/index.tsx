import { useCallback, useState } from "react";
import { FlatList, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { MotiView } from "moti";
import { TrendingDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { Fab } from "@/components/ui/fab";
import { BrandMark } from "@/components/brand-mark";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { api, ApiClientError } from "@/lib/api";

interface ExpenseRow {
  id: string;
  category: string;
  amount: number;
  note: string | null;
  occurredAt: string;
  recordedBy: string;
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function ExpenseItem({ row }: { row: ExpenseRow }) {
  return (
    <View className="border-b border-slate-100 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-body-semibold text-sm text-slate-900">${row.amount.toFixed(2)}</Text>
          <Badge variant="default">{row.category}</Badge>
        </View>
        <Text variant="muted" className="text-xs">{formatShortDate(row.occurredAt)}</Text>
      </View>
      {row.note ? (
        <Text variant="muted" className="mt-0.5 text-xs" numberOfLines={1}>
          {row.note}
        </Text>
      ) : null}
    </View>
  );
}

export default function ReceptionistExpensesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (opts: { silent?: boolean } = {}) => {
    if (!opts.silent) setLoading(true);
    setError(null);
    try {
      const list = await api.get<ExpenseRow[]>("/expenses");
      setItems(list);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 0) {
        // Offline — show whatever is cached (empty) without an error banner
      } else {
        setError("Couldn't load expenses. Check your connection.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View className="flex-1 bg-white">
      <MotiView
        from={{ opacity: 0, translateY: -6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 220 }}
        className="relative overflow-hidden border-b border-slate-100 bg-gold-50/60 p-4"
      >
        <DecorativeShapes tone="gold" />
        <View className="flex-row items-center gap-2">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-gold-100">
            <TrendingDown size={16} color="#A37A1D" />
          </View>
          <View>
            <Text variant="heading">Expenses</Text>
            <BrandMark size="xs" />
          </View>
        </View>
        {error ? <ErrorState message={error} onRetry={() => load()} className="mt-3" /> : null}
      </MotiView>

      {loading ? (
        <View className="px-4 pt-4">
          <SkeletonList rows={5} />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={items}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) => <ExpenseItem row={item} />}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load({ silent: true });
          }}
          contentContainerStyle={{ paddingBottom: 96 }}
          ListEmptyComponent={
            <View className="items-center justify-center p-10">
              <TrendingDown size={32} color="#cbd5e1" />
              <Text variant="muted" className="mt-3 text-center">
                No expenses recorded yet.{"\n"}Tap the + button to record one.
              </Text>
            </View>
          }
        />
      )}

      <Fab accessibilityLabel="Record expense" onPress={() => router.push("/receptionist/expenses/new")} />
    </View>
  );
}
