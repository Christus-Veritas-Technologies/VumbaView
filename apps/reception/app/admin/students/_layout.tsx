import { Stack } from "expo-router";

export default function AdminStudentsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: "Students" }} />
      <Stack.Screen name="[id]" options={{ title: "Student" }} />
    </Stack>
  );
}
