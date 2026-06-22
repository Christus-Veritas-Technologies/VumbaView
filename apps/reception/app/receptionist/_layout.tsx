import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { authLog } from "@/lib/debug-log";

export default function ReceptionistLayout() {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    authLog("guard:receptionist/_layout", "staff=null -> redirect /login");
    return <Redirect href="/login" />;
  }
  if (staff.role !== "RECEPTIONIST") {
    authLog("guard:receptionist/_layout", "staff=", staff.username, "role=", staff.role, "-> redirect /admin");
    return <Redirect href="/admin" />;
  }
  authLog("guard:receptionist/_layout", "staff=", staff.username, "RECEPTIONIST ok, rendering stack");

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTintColor: "#A37A1D",
        headerTitleStyle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: "#0f172a" },
      }}
    >
      <Stack.Screen name="index" options={{ title: "Students" }} />
      <Stack.Screen name="students/new" options={{ title: "Add Student", presentation: "modal" }} />
      <Stack.Screen name="students/[id]" options={{ title: "Student" }} />
      <Stack.Screen name="students/[id]/edit" options={{ title: "Edit Student", presentation: "modal" }} />
      <Stack.Screen name="students/[id]/pay" options={{ title: "Record Payment", presentation: "modal" }} />
    </Stack>
  );
}
