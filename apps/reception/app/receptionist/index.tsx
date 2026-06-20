import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Text } from "@/components/ui/text";
import { StudentListItem } from "@/components/student-list-item";
import { ErrorState } from "@/components/ui/error-state";
import { listStudentsCache, type StudentCacheRow } from "@/lib/storage/db";
import { syncNow } from "@/lib/sync";
import { ACADEMIC_LEVELS, LEVEL_LABELS } from "@/lib/types";
import { useSyncStore } from "@/store/sync-store";
import { useGridColumns } from "@/lib/use-breakpoint";

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
      <View className="border-b border-slate-100 p-4 md:px-6">
        <View className="flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name"
            className="md:flex-1"
          />
          <Select
            options={LEVEL_FILTER_OPTIONS}
            value={level}
            onValueChange={setLevel}
            placeholder="All levels"
            className="md:w-56"
          />
        </View>
        {pendingCount > 0 ? (
          <Text className="mt-2 text-sm text-amber-700">
            {pendingCount} record{pendingCount === 1 ? "" : "s"} waiting to sync
          </Text>
        ) : null}
        {error ? <ErrorState message={error} onRetry={load} className="mt-3" /> : null}
      </View>

      <FlatList
        key={columns}
        data={students}
        keyExtractor={(s) => s.id}
        numColumns={columns}
        columnWrapperStyle={columns > 1 ? { gap: 12, paddingHorizontal: 16 } : undefined}
        renderItem={({ item }) => (
          <StudentListItem
            student={item}
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

      <Pressable
        onPress={() => router.push("/receptionist/students/new")}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-slate-900 shadow-lg active:bg-slate-800"
      >
        <Plus color="#fff" size={24} />
      </Pressable>
    </View>
  );
}
