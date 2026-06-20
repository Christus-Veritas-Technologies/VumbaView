import { Redirect, Tabs } from "expo-router";
import { LayoutDashboard, Settings, Users } from "lucide-react-native";
import { useAuthStore } from "@/store/auth-store";

export default function AdminLayout() {
  const staff = useAuthStore((s) => s.staff);

  if (!staff) {
    return <Redirect href="/login" />;
  }
  if (staff.role !== "ADMIN") {
    return <Redirect href="/receptionist" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: "#0f172a" }}>
      <Tabs.Screen
        name="index"
        options={{ title: "Dashboard", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="students"
        options={{ title: "Students", headerShown: false, tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: "Settings", headerShown: false, tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }}
      />
    </Tabs>
  );
}
