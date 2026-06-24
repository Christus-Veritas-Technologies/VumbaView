import { Stack } from "expo-router";

export default function ReceptionistPaymentsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Payments" }} />
      {/* Step 1 of the standalone "new payment" flow — pick who it's for.
          Presented as its own modal sheet (matches students/new.tsx). */}
      <Stack.Screen name="new/index" options={{ title: "New Payment", presentation: "modal" }} />
      {/* Step 2 — pushed *inside* the same modal sheet opened above (no
          `presentation` override), so picking a student feels like advancing
          one flow rather than opening a second, stacked sheet. */}
      <Stack.Screen name="new/[studentId]" options={{ title: "Record Payment" }} />
    </Stack>
  );
}
