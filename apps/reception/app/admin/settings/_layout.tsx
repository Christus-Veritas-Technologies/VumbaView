import { Stack } from "expo-router";

export default function AdminSettingsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="new-staff" options={{ title: "Add Staff", presentation: "modal" }} />
    </Stack>
  );
}
