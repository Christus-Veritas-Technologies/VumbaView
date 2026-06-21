import { Stack } from "expo-router";

export default function AdminStudentsLayout() {
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
      <Stack.Screen name="[id]" options={{ title: "Student" }} />
    </Stack>
  );
}
