import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { SheetScreen } from "@/components/ui/sheet-screen";
import { StudentForm, type StudentFormValues } from "@/components/student-form";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { queueCreateStudent } from "@/lib/sync";

export default function NewStudentScreen() {
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(values: StudentFormValues) {
    if (!values.fullName) {
      Alert.alert("Full name is required");
      return;
    }

    setSubmitting(true);
    try {
      const localId = queueCreateStudent(
        {
          fullName: values.fullName,
          level: values.level,
          guardianName: values.guardianName || undefined,
          guardianPhone: values.guardianPhone || undefined,
          guardianEmail: values.guardianEmail || undefined,
          guardianAddress: values.guardianAddress || undefined,
        },
        staff?.id ?? null,
      );
      useSyncStore.getState().runSync();
      router.replace(`/receptionist/students/${localId}`);
    } catch (err) {
      Alert.alert("Couldn't add student", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SheetScreen>
      <StudentForm submitLabel="Add student" submitting={submitting} onSubmit={handleSubmit} />
    </SheetScreen>
  );
}
