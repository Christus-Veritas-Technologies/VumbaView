import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";

export default function ReceptionistLayout() {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    return <Redirect href="/login" />;
  }
  if (staff.role !== "RECEPTIONIST") {
    return <Redirect href="/admin" />;
  }

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Students" }} />
      <Stack.Screen name="students/new" options={{ title: "Add Student" }} />
      <Stack.Screen name="students/[id]" options={{ title: "Student" }} />
      <Stack.Screen name="students/[id]/edit" options={{ title: "Edit Student" }} />
      <Stack.Screen name="students/[id]/pay" options={{ title: "Record Payment", presentation: "modal" }} />
    </Stack>
  );
}
