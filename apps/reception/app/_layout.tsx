import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import {
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useAuthStore } from "@/store/auth-store";
import { useSyncEngine, useSyncStore } from "@/store/sync-store";
import { initDb } from "@/lib/storage/db";
import { authLog } from "@/lib/debug-log";

initDb();

export default function RootLayout() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const hydrated = useAuthStore((s) => s.hydrated);
  // Inter for body copy, Plus Jakarta Sans for headings/titles — loaded once
  // here so every screen's "font-heading"/"font-body*" classes resolve.
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    authLog("RootLayout:mount-effect:start");
    (async () => {
      await hydrate();
      authLog("RootLayout:mount-effect:hydrate-done, staff=", useAuthStore.getState().staff?.username ?? "(none)");
      // Catch up on anything queued from a previous session, and pull a
      // fresh snapshot, before the first screen renders. NOTE: this fires
      // unconditionally, even with no token yet — watch the request:start
      // log for "GET /students auth= true tokenAttached= false" right
      // around a login to see if this is racing it.
      authLog("RootLayout:mount-effect:runSync-start");
      await useSyncStore.getState().runSync();
      authLog("RootLayout:mount-effect:runSync-done, staff=", useAuthStore.getState().staff?.username ?? "(none)");
    })();
  }, [hydrate]);

  // Wires connectivity + foreground-poll triggers for the lifetime of the app.
  useSyncEngine();

  if (!hydrated || !fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="receptionist" />
        <Stack.Screen
          name="receipt/[id]"
          options={{
            headerShown: true,
            title: "Receipt",
            headerStyle: { backgroundColor: "#ffffff" },
            headerShadowVisible: false,
            headerTintColor: "#A37A1D",
            headerTitleStyle: { fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: "#0f172a" },
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
