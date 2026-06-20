import { Stack } from "expo-router";

export default function AdminSettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="new-staff" options={{ title: "Add Staff", presentation: "modal" }} />
    </Stack>
  );
}
