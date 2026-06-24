import { Redirect, Tabs } from "expo-router";
import { CreditCard, Settings, Users } from "lucide-react-native";
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
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#ffffff" },
        headerShadowVisible: false,
        headerTitleStyle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: "#0f172a" },
        tabBarActiveTintColor: "#A37A1D",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: { borderTopColor: "#f1f5f9" },
        tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
      }}
    >
      {/* Hidden — exists only so bare /receptionist redirects somewhere
          sensible. Never shown as a tab. */}
      <Tabs.Screen name="index" options={{ href: null, headerShown: false }} />
      <Tabs.Screen
        name="payments"
        options={{
          title: "Payments",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size} />,
        }}
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
