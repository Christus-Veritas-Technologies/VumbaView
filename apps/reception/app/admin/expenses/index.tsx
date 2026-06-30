import { useCallback, useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { MotiView } from "moti";
import { TrendingDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonList } from "@/components/ui/skeleton";
import { BrandMark } from "@/components/brand-mark";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { PeriodSelector, periodRange, type PeriodKey } from "@/components/period-selector";
import { ReportButton } from "@/components/report-button";
import { api } from "@/lib/api";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { BUILTIN_EXPENSE_CATEGORIES } from "@/lib/types";

const PAGE_SIZE = 20;

interface AdminExpenseRow {
  id: string;
  category: string;
  amount: number;
  note: string | null;
  occurredAt: string;
  recordedBy: string;
}

interface AdminExpensesResponse {
  items: AdminExpenseRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const CATEGORY_FILTER_OPTIONS = [
  { label: "All categories", value: "" },
  ...BUILTIN_EXPENSE_CATEGORIES.map((c) => ({ label: c, value: c })),
];

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function ExpenseRowTablet({ row }: { row: AdminExpenseRow }) {
  return (
    <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3">
      <View className="w-28">
        <Text className="text-sm text-slate-700">{formatShortDate(row.occurredAt)}</Text>
        <Text variant="muted" className="text-xs">
          {new Date(row.occurredAt).getFullYear()}
        </Text>
      </View>
      <View className="w-36">
        <Badge variant="default">{row.category}</Badge>
      </View>
      <View className="w-24 items-end">
        <Text className="font-body-semibold text-sm text-slate-900">${row.amount.toFixed(2)}</Text>
      </View>
      <View className="flex-1">
        <Text variant="muted" className="text-sm" numberOfLines={1}>
          {row.note ?? "—"}
        </Text>
      </View>
      <View className="w-28">
        <Text className="text-sm text-slate-600">{row.recordedBy}</Text>
      </View>
    </View>
  );
}

function ExpenseRowPhone({ row }: { row: AdminExpenseRow }) {
  return (
    <View className="border-b border-slate-100 px-4 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className="font-body-semibold text-sm text-slate-900">${row.amount.toFixed(2)}</Text>
          <Badge variant="default">{row.category}</Badge>
        </View>
        <Text variant="muted" className="text-xs">{formatShortDate(row.occurredAt)}</Text>
      </View>
      <Text variant="muted" className="mt-0.5 text-xs">
        {row.recordedBy}{row.note ? ` · ${row.note}` : ""}
      </Text>
    </View>
  );
}

export default function AdminExpensesScreen() {
  const { isTablet } = useBreakpoint();

  const [items, setItems] = useState<AdminExpenseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [period, setPeriod] = useState<PeriodKey>("all");

  const fetchPage = useCallback(
    async (targetPage: number, opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      setError(null);
      try {
        const { from, to } = periodRange(period);
        const res = await api.get<AdminExpensesResponse>("/expenses/admin", {
          page: String(targetPage),
          pageSize: String(PAGE_SIZE),
          category: category || undefined,
          from: from?.toISOString(),
          to: to?.toISOString(),
        });
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } catch {
        setError("Couldn't load expenses.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, period],
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchPage(page, { silent: true });
  }

  return (
    <View className="flex-1 bg-white">
      <MotiView
        from={{ opacity: 0, translateY: -6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 220 }}
        className="relative overflow-hidden border-b border-slate-100 bg-gold-50/60 p-4 md:px-6"
      >
        <DecorativeShapes tone="gold" />
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-gold-100">
              <TrendingDown size={16} color="#A37A1D" />
            </View>
            <View>
              <Text variant="heading">Expenses</Text>
              <BrandMark size="xs" />
            </View>
          </View>
          {total > 0 ? (
            <View className="rounded-full bg-gold-100 px-3 py-1">
              <Text className="font-body-semibold text-xs text-gold-700">
                {total} expense{total === 1 ? "" : "s"}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ReportButton scope="expenses" path="/reports/expenses" filenamePrefix="all-expenses" label="Report" />
        </View>

        <Select
          options={CATEGORY_FILTER_OPTIONS}
          value={category}
          onValueChange={setCategory}
          placeholder="All categories"
          className="md:w-52"
        />

        {error ? <ErrorState message={error} onRetry={() => fetchPage(page)} className="mt-3" /> : null}
      </MotiView>

      {isTablet ? (
        <View className="flex-row items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2">
          <Text variant="muted" className="w-28 text-xs uppercase tracking-wide">Date</Text>
          <Text variant="muted" className="w-36 text-xs uppercase tracking-wide">Category</Text>
          <Text variant="muted" className="w-24 text-right text-xs uppercase tracking-wide">Amount</Text>
          <Text variant="muted" className="flex-1 text-xs uppercase tracking-wide">Note</Text>
          <Text variant="muted" className="w-28 text-xs uppercase tracking-wide">Recorded by</Text>
        </View>
      ) : null}

      {loading ? (
        <View className="px-4 pt-4">
          <SkeletonList rows={6} />
        </View>
      ) : (
        <FlatList
          className="flex-1"
          data={items}
          keyExtractor={(r) => r.id}
          renderItem={({ item }) =>
            isTablet ? <ExpenseRowTablet row={item} /> : <ExpenseRowPhone row={item} />
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center p-10">
              <Text variant="muted">No expenses recorded yet.</Text>
            </View>
          }
        />
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        hasPrev={page > 1}
        hasNext={page < totalPages}
        onPrev={() => fetchPage(page - 1)}
        onNext={() => fetchPage(page + 1)}
        total={total}
      />
    </View>
  );
}
