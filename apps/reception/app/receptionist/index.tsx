import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Search } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { StudentListItem } from "@/components/student-list-item";
import { ErrorState } from "@/components/ui/error-state";
import { Fab } from "@/components/ui/fab";
import { Pagination } from "@/components/ui/pagination";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { BrandMark } from "@/components/brand-mark";
import { listStudentsCache, type StudentCacheRow } from "@/lib/storage/db";
import { syncNow } from "@/lib/sync";
import { ACADEMIC_LEVELS, LEVEL_LABELS } from "@/lib/types";
import { useSyncStore } from "@/store/sync-store";
import { useGridColumns } from "@/lib/use-breakpoint";
import { usePagination } from "@/lib/use-pagination";

const LEVEL_FILTER_OPTIONS = [
  { label: "All levels", value: "" },
  ...ACADEMIC_LEVELS.map((l) => ({ label: LEVEL_LABELS[l], value: l })),
];

export default function StudentDirectoryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [students, setStudents] = useState<StudentCacheRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pendingCount = useSyncStore((s) => s.pendingCount);
  // Tablet-and-up: 2-column card grid. Phone: single-column row list.
  const columns = useGridColumns(2);
  const pag = usePagination(students, { resetKey: `${query}|${level}` });

  const load = useCallback(() => {
    try {
      setStudents(listStudentsCache({ q: query || undefined, level: level || undefined, status: "ACTIVE" }));
      setError(null);
    } catch {
      setError("Couldn't load students from the local cache.");
    }
  }, [query, level]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await syncNow();
    } finally {
      load();
      setRefreshing(false);
    }
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
          <View>
            <Text variant="heading">Students</Text>
            <BrandMark className="mt-0.5" />
          </View>
          {students.length > 0 ? (
            <View className="rounded-full bg-gold-100 px-3 py-1">
              <Text className="font-body-semibold text-xs text-gold-700">{students.length} active</Text>
            </View>
          ) : null}
        </View>
        <View className="flex-col gap-3 md:flex-row md:items-center">
          <View className="relative md:flex-1">
            <View className="absolute left-3 top-0 z-10 h-11 w-5 items-center justify-center">
              <Search size={16} color="#94a3b8" />
            </View>
            <Input value={query} onChangeText={setQuery} placeholder="Search by name" className="pl-9" />
          </View>
          <Select
            options={LEVEL_FILTER_OPTIONS}
            value={level}
            onValueChange={setLevel}
            placeholder="All levels"
            className="md:w-56"
          />
        </View>
        {pendingCount > 0 ? (
          <Text className="mt-2 text-sm text-warning-700">
            {pendingCount} record{pendingCount === 1 ? "" : "s"} waiting to sync
          </Text>
        ) : null}
        {error ? <ErrorState message={error} onRetry={load} className="mt-3" /> : null}
      </MotiView>

      <FlatList
        key={columns}
        className="flex-1"
        data={pag.pageItems}
        keyExtractor={(s) => s.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { gap: 12, paddingHorizontal: 16 } : undefined}
        renderItem={({ item, index }) => (
          <StudentListItem
            student={item}
            index={index}
            variant={columns > 1 ? "card" : "row"}
            onPress={() => router.push(`/receptionist/students/${item.id}`)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 96, gap: columns > 1 ? 12 : 0, paddingTop: columns > 1 ? 12 : 0 }}
        ListEmptyComponent={
          <View className="items-center justify-center p-10">
            <Text variant="muted">No students found.</Text>
          </View>
        }
      />
      {/* Extra bottom margin clears the floating add button in the same corner. */}
      <Pagination
        page={pag.page}
        totalPages={pag.totalPages}
        hasPrev={pag.hasPrev}
        hasNext={pag.hasNext}
        onPrev={pag.prev}
        onNext={pag.next}
        total={pag.total}
        className="mb-16"
      />

      <Fab accessibilityLabel="Add student" onPress={() => router.push("/receptionist/students/new")} />
    </View>
  );
}
