import { useMemo, useState } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { Search, UserPlus } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetScreen } from "@/components/ui/sheet-screen";
import { StudentListItem } from "@/components/student-list-item";
import { listStudentsCache, type StudentCacheRow } from "@/lib/storage/db";

/**
 * Step 1 of the Payments-tab "new payment" flow — there's no student in
 * context yet (unlike students/[id]/pay.tsx, reached from a known
 * student's detail page), so this picks one first. Tapping a result pushes
 * into new/[studentId].tsx *within this same modal sheet* — see
 * payments/_layout.tsx for why that screen isn't its own modal.
 */
export default function NewPaymentPickStudentScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const students = useMemo<StudentCacheRow[]>(
    () => listStudentsCache({ q: query.trim() || undefined, status: "ACTIVE" }),
    [query],
  );

  return (
    <SheetScreen>
      <View className="border-b border-slate-100 p-4">
        <Text variant="heading">New Payment</Text>
        <Text variant="muted" className="mt-0.5">
          Choose a student to record a payment for.
        </Text>
        <View className="relative mt-3">
          <View className="absolute left-3 top-0 z-10 h-11 w-5 items-center justify-center">
            <Search size={16} color="#94a3b8" />
          </View>
          <Input value={query} onChangeText={setQuery} placeholder="Search by name" className="pl-9" autoFocus />
        </View>
      </View>

      <FlatList
        className="flex-1"
        data={students}
        keyExtractor={(s) => s.id}
        renderItem={({ item, index }) => (
          <StudentListItem
            student={item}
            index={index}
            onPress={() => router.push(`/receptionist/payments/new/${item.id}`)}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="items-center justify-center gap-3 p-10">
            <Text variant="muted" className="text-center">
              {query ? "No students match that search." : "No active students yet."}
            </Text>
            {!query ? (
              <Button variant="secondary" onPress={() => router.push("/receptionist/students/new")}>
                <UserPlus size={16} color="#0f172a" />
                <Text className="ml-2 font-body-semibold text-base text-slate-900">Add a student</Text>
              </Button>
            ) : null}
          </View>
        }
      />
    </SheetScreen>
  );
}
