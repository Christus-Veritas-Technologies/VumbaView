import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, View } from "react-native";
import { MotiView } from "moti";
import { Printer, Receipt, Search } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonList } from "@/components/ui/skeleton";
import { PrinterDevicePicker } from "@/components/printer-device-picker";
import { BrandMark } from "@/components/brand-mark";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { api } from "@/lib/api";
import { usePrinterFlow } from "@/lib/use-printer-flow";
import { useBreakpoint } from "@/lib/use-breakpoint";
import { LEVEL_LABELS, PAYMENT_CATEGORIES, type AcademicLevel, type PaymentCategory } from "@/lib/types";
import type { ReceiptPrintData } from "@/lib/printer";

const SCHOOL_NAME = "VumbaView Academy";
const PAGE_SIZE = 20;

interface AdminPaymentRow {
  id: string;
  category: PaymentCategory;
  amount: number;
  note: string | null;
  occurredAt: string;
  studentId: string;
  studentName: string;
  admissionNo: number;
  level: AcademicLevel;
  recordedBy: string;
}

interface AdminPaymentsResponse {
  items: AdminPaymentRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const CATEGORY_LABELS: Record<PaymentCategory, string> = { FEES: "Fees", UNIFORMS: "Uniforms", CUSTOM: "Custom" };
const CATEGORY_BADGE_VARIANT: Record<PaymentCategory, "success" | "gold" | "default"> = {
  FEES: "success",
  UNIFORMS: "gold",
  CUSTOM: "default",
};

const CATEGORY_FILTER_OPTIONS = [
  { label: "All categories", value: "" },
  ...PAYMENT_CATEGORIES.map((c) => ({ label: CATEGORY_LABELS[c], value: c })),
];

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function CategoryBadge({ category }: { category: PaymentCategory }) {
  return <Badge variant={CATEGORY_BADGE_VARIANT[category]}>{CATEGORY_LABELS[category]}</Badge>;
}

function buildReceiptData(row: AdminPaymentRow): ReceiptPrintData {
  return {
    schoolName: SCHOOL_NAME,
    receiptId: row.id,
    occurredAt: row.occurredAt,
    studentName: row.studentName,
    level: LEVEL_LABELS[row.level],
    admissionNo: row.admissionNo,
    category: row.category,
    amount: row.amount,
    note: row.note,
    recordedBy: row.recordedBy,
  };
}

interface RowProps {
  row: AdminPaymentRow;
  printing: boolean;
  onPrint: (row: AdminPaymentRow) => void;
}

/** Full row: shown md and up — every field, plus admission/level context. */
function PaymentRowTablet({ row, printing, onPrint }: RowProps) {
  return (
    <View className="flex-row items-center gap-3 border-b border-slate-100 px-4 py-3">
      <View className="w-24">
        <Text className="text-sm text-slate-700">{formatShortDate(row.occurredAt)}</Text>
        <Text variant="muted" className="text-xs">
          {new Date(row.occurredAt).getFullYear()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="font-body-semibold text-sm text-slate-900">{row.studentName}</Text>
        <Text variant="muted" className="text-xs">
          {LEVEL_LABELS[row.level]} · Admission #{row.admissionNo}
        </Text>
      </View>
      <View className="w-24">
        <CategoryBadge category={row.category} />
      </View>
      <View className="w-20 items-end">
        <Text className="font-body-semibold text-sm text-slate-900">${row.amount.toFixed(2)}</Text>
      </View>
      <View className="w-28">
        <Text className="text-sm text-slate-600">{row.recordedBy}</Text>
      </View>
      <Pressable
        onPress={() => onPrint(row)}
        disabled={printing}
        className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
      >
        {printing ? <ActivityIndicator size="small" color="#0f172a" /> : <Printer size={16} color="#0f172a" />}
      </Pressable>
    </View>
  );
}

/** Compact row: phone — exactly date, amount, recorder, and payment type, per spec. */
function PaymentRowPhone({ row, printing, onPrint }: RowProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-100 px-4 py-3">
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-body-semibold text-sm text-slate-900">${row.amount.toFixed(2)}</Text>
          <CategoryBadge category={row.category} />
        </View>
        <Text variant="muted" className="mt-0.5 text-xs">
          {formatShortDate(row.occurredAt)} · {row.recordedBy}
        </Text>
      </View>
      <Pressable
        onPress={() => onPrint(row)}
        disabled={printing}
        className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200"
      >
        {printing ? <ActivityIndicator size="small" color="#0f172a" /> : <Printer size={16} color="#0f172a" />}
      </Pressable>
    </View>
  );
}

export default function AdminPaymentsScreen() {
  const { isTablet } = useBreakpoint();
  const printer = usePrinterFlow();

  const [items, setItems] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [printingRowId, setPrintingRowId] = useState<string | null>(null);

  // Debounce the free-text search so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchText.trim()), 350);
    return () => clearTimeout(t);
  }, [searchText]);

  const fetchPage = useCallback(
    async (targetPage: number, opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      setError(null);
      try {
        const res = await api.get<AdminPaymentsResponse>("/payments/admin", {
          page: String(targetPage),
          pageSize: String(PAGE_SIZE),
          category: category || undefined,
          q: query || undefined,
        });
        setItems(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setPage(res.page);
      } catch {
        setError("Couldn't load payments.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, query],
  );

  // Re-runs (and resets to page 1) whenever the filters change — including
  // the very first render, which is what loads page 1 on mount.
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  // Clears once both the print call and any device-picker prompt it opened
  // have settled, regardless of whether printing succeeded.
  useEffect(() => {
    if (!printer.printing && !printer.pickerVisible) {
      setPrintingRowId(null);
    }
  }, [printer.printing, printer.pickerVisible]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchPage(page, { silent: true });
  }

  function handlePrint(row: AdminPaymentRow) {
    setPrintingRowId(row.id);
    printer.requestPrint(buildReceiptData(row));
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
              <Receipt size={16} color="#A37A1D" />
            </View>
            <View>
              <Text variant="heading">Fees &amp; Payments</Text>
              <BrandMark size="xs" />
            </View>
          </View>
          {total > 0 ? (
            <View className="rounded-full bg-gold-100 px-3 py-1">
              <Text className="font-body-semibold text-xs text-gold-700">
                {total} payment{total === 1 ? "" : "s"}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="flex-col gap-3 md:flex-row md:items-center">
          <View className="relative md:flex-1">
            <View className="absolute left-3 top-0 z-10 h-11 w-5 items-center justify-center">
              <Search size={16} color="#94a3b8" />
            </View>
            <Input value={searchText} onChangeText={setSearchText} placeholder="Search by student name" className="pl-9" />
          </View>
          <Select
            options={CATEGORY_FILTER_OPTIONS}
            value={category}
            onValueChange={setCategory}
            placeholder="All categories"
            className="md:w-52"
          />
        </View>

        {error ? <ErrorState message={error} onRetry={() => fetchPage(page)} className="mt-3" /> : null}
        {printer.printError ? <ErrorState message={printer.printError} className="mt-3" /> : null}
      </MotiView>

      {/* Column labels — only meaningful once there's a fixed multi-column layout (md+). */}
      {isTablet ? (
        <View className="flex-row items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2">
          <Text variant="muted" className="w-24 text-xs uppercase tracking-wide">
            Date
          </Text>
          <Text variant="muted" className="flex-1 text-xs uppercase tracking-wide">
            Student
          </Text>
          <Text variant="muted" className="w-24 text-xs uppercase tracking-wide">
            Type
          </Text>
          <Text variant="muted" className="w-20 text-right text-xs uppercase tracking-wide">
            Amount
          </Text>
          <Text variant="muted" className="w-28 text-xs uppercase tracking-wide">
            Recorded by
          </Text>
          <View className="w-9" />
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
            isTablet ? (
              <PaymentRowTablet row={item} printing={printingRowId === item.id} onPrint={handlePrint} />
            ) : (
              <PaymentRowPhone row={item} printing={printingRowId === item.id} onPrint={handlePrint} />
            )
          }
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListEmptyComponent={
            <View className="items-center justify-center p-10">
              <Text variant="muted">No payments found.</Text>
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

      <PrinterDevicePicker
        visible={printer.pickerVisible}
        onClose={printer.closePicker}
        onConnected={printer.handleDeviceConnected}
      />
    </View>
  );
}
