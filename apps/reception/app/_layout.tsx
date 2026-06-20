import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useSyncEngine, useSyncStore } from "@/store/sync-store";
import { initDb } from "@/lib/storage/db";

initDb();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    (async () => {
      await hydrate();
      // Catch up on anything queued from a previous session, and pull a
      // fresh snapshot, before the first screen renders.
      await useSyncStore.getState().runSync();
    })();
  }, [hydrate]);

  // Wires connectivity + foreground-poll triggers for the lifetime of the app.
  useSyncEngine();

  if (!hydrated) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="receptionist" />
        <Stack.Screen name="receipt/[id]" options={{ headerShown: true, title: "Receipt" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
