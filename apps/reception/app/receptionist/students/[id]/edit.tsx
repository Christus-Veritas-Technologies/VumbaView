import { useState } from "react";
import { Alert, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ErrorState } from "@/components/ui/error-state";
import { StudentForm, type StudentFormValues } from "@/components/student-form";
import { getStudentCache, type StudentCacheRow } from "@/lib/storage/db";
import { queueUpdateStudent } from "@/lib/sync";
import { useSyncStore } from "@/store/sync-store";

function loadStudent(id?: string): { student: StudentCacheRow | null; error: string | null } {
  try {
    return { student: id ? getStudentCache(id) : null, error: null };
  } catch {
    return { student: null, error: "Couldn't load this student from the local cache." };
  }
}

export default function EditStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const { student, error: loadError } = loadStudent(id);

  if (!student) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ErrorState message={loadError ?? "Student not found."} />
      </View>
    );
  }

  function handleSubmit(values: StudentFormValues) {
    setSubmitting(true);
    try {
      queueUpdateStudent(student.id, {
        fullName: values.fullName,
        level: values.level,
        status: values.status,
        guardianName: values.guardianName,
        guardianPhone: values.guardianPhone,
        guardianEmail: values.guardianEmail,
        guardianAddress: values.guardianAddress,
      });
      useSyncStore.getState().runSync();
      router.back();
    } catch (err) {
      Alert.alert("Couldn't save changes", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <StudentForm
      submitLabel="Save changes"
      submitting={submitting}
      showStatus
      initial={{
        fullName: student.fullName,
        level: student.level,
        status: student.status,
        guardianName: student.guardianName ?? "",
        guardianPhone: student.guardianPhone ?? "",
        guardianEmail: student.guardianEmail ?? "",
        guardianAddress: student.guardianAddress ?? "",
      }}
      onSubmit={handleSubmit}
    />
  );
}
