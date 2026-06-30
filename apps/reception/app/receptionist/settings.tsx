import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { CheckCircle2, LogOut, RefreshCw, User, XCircle } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { BrandMark } from "@/components/brand-mark";
import { syncNowAndReport } from "@/lib/sync";
import { useAuthStore } from "@/store/auth-store";

export default function ReceptionistSettingsScreen() {
  const router = useRouter();
  const staff = useAuthStore((s) => s.staff);
  const logout = useAuthStore((s) => s.logout);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ processed: number; failed: number } | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSyncNow() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const result = await syncNowAndReport();
      setSyncResult(result);
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed. Check your connection.");
    } finally {
      setSyncing(false);
    }
  }

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
        className="w-full p-4 md:mx-auto md:max-w-2xl md:p-6"
      >
        <Text variant="heading" className="mb-1">
          Settings
        </Text>
        <BrandMark className="mb-4" />

        <Card className="relative mb-4 overflow-hidden">
          <DecorativeShapes tone="info" />
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-info-100">
                <User size={16} color="#2563EB" />
              </View>
              <CardTitle>Account</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center gap-1.5">
              <Text className="font-body-medium">{staff?.username}</Text>
              <Badge variant="default">Receptionist</Badge>
            </View>
          </CardContent>
        </Card>

        <Card className="relative mb-4 overflow-hidden">
          <DecorativeShapes tone="violet" />
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                <RefreshCw size={16} color="#7C3AED" />
              </View>
              <CardTitle>Sync</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text variant="muted" className="mb-3">
              Changes you make offline are synced automatically when you're connected. Tap below to force a sync now
              and see the result.
            </Text>

            {syncResult ? (
              <View className="mb-3 flex-row items-center gap-2 rounded-xl bg-success-50 px-3 py-2">
                <CheckCircle2 size={16} color="#16A34A" />
                <Text className="flex-1 font-body-medium text-sm text-success-700">
                  {syncResult.processed > 0
                    ? `${syncResult.processed} item${syncResult.processed === 1 ? "" : "s"} synced successfully.`
                    : "Nothing to sync — you're up to date."}
                  {syncResult.failed > 0 ? ` (${syncResult.failed} failed)` : ""}
                </Text>
              </View>
            ) : syncError ? (
              <View className="mb-3 flex-row items-center gap-2 rounded-xl bg-danger-50 px-3 py-2">
                <XCircle size={16} color="#DC2626" />
                <Text className="flex-1 font-body-medium text-sm text-danger-700">{syncError}</Text>
              </View>
            ) : null}

            <Button variant="outline" loading={syncing} disabled={syncing} onPress={handleSyncNow}>
              <RefreshCw size={15} color="#7C3AED" />
              <Text className="ml-2 font-body-semibold text-sm text-violet-700">
                {syncing ? "Syncing…" : "Sync now"}
              </Text>
            </Button>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-danger-100">
                <LogOut size={16} color="#DC2626" />
              </View>
              <CardTitle>Log out</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <Text variant="muted" className="mb-4">
              Logging out will require signing back in to access this app.
            </Text>
            <Button variant="destructive" onPress={handleLogout}>
              <LogOut size={16} color="#fff" />
              <Text className="ml-2 font-body-semibold text-base text-white">Log out</Text>
            </Button>
          </CardContent>
        </Card>
      </MotiView>
    </ScrollView>
  );
}
