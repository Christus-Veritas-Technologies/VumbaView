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
import { Pagination } from "@/components/ui/pagination";
import { listStudentsCache, type StudentCacheRow } from "@/lib/storage/db";
import { syncNow } from "@/lib/sync";
import { ACADEMIC_LEVELS, LEVEL_LABELS } from "@/lib/types";
import { useGridColumns } from "@/lib/use-breakpoint";
import { usePagination } from "@/lib/use-pagination";

const LEVEL_FILTER_OPTIONS = [
  { label: "All levels", value: "" },
  ...ACADEMIC_LEVELS.map((l) => ({ label: LEVEL_LABELS[l], value: l })),
];

export default function AdminStudentDirectoryScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [students, setStudents] = useState<StudentCacheRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const columns = useGridColumns(2);
  const pag = usePagination(students, { resetKey: `${query}|${level}` });

  const load = useCallback(() => {
    try {
      setStudents(listStudentsCache({ q: query || undefined, level: level || undefined }));
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
        className="border-b border-slate-100 p-4 md:px-6"
      >
        <View className="flex-col gap-3 md:flex-row md:items-center">
          <View className="relative md:flex-1">
            <View className="absolute left-3 top-0 z-10 h-11 w-5 items-center justify-center">
              <Search size={16} color="#94a3b8" />
            </View>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name"
              className="pl-9"
            />
          </View>
          <Select
            options={LEVEL_FILTER_OPTIONS}
            value={level}
            onValueChange={setLevel}
            placeholder="All levels"
            className="md:w-56"
          />
        </View>
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
            variant={columns > 1 ? "card" : "row"}
            index={index}
            onPress={() => router.push(`/admin/students/${item.id}`)}
          />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={{ paddingBottom: 24, gap: columns > 1 ? 12 : 0, paddingTop: columns > 1 ? 12 : 0 }}
        ListEmptyComponent={
          <View className="items-center justify-center p-10">
            <Text variant="muted">No students found.</Text>
          </View>
        }
      />
      <Pagination
        page={pag.page}
        totalPages={pag.totalPages}
        hasPrev={pag.hasPrev}
        hasNext={pag.hasNext}
        onPrev={pag.prev}
        onNext={pag.next}
        total={pag.total}
      />
    </View>
  );
}
