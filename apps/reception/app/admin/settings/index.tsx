import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { Calendar, Check, LogOut, UserPlus, Users, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/ui/error-state";
import { Pagination } from "@/components/ui/pagination";
import { SkeletonList } from "@/components/ui/skeleton";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { BrandMark } from "@/components/brand-mark";
import { StartNewTermButton } from "@/components/start-new-term-button";
import { api, ApiClientError } from "@/lib/api";
import { ACADEMIC_LEVELS, LEVEL_LABELS, ROOT_ADMIN_USERNAME, type AcademicLevel, type StaffRole } from "@/lib/types";
import { usePagination } from "@/lib/use-pagination";
import { optionalAmount } from "@/lib/validation";
import { useAuthStore } from "@/store/auth-store";

interface StaffRow {
  id: string;
  username: string;
  role: StaffRole;
  active: boolean;
  createdAt: string;
}

interface LevelFeeRow {
  level: AcademicLevel;
  amount: number | string;
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [fees, setFees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingFees, setSavingFees] = useState(false);
  const [editingLevel, setEditingLevel] = useState<AcademicLevel | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Staff accounts page 5-at-a-time per the admin's request, rather than the
  // app-wide default page size.
  const staffPag = usePagination(staff, { pageSize: 5 });

  const feeErrors: Partial<Record<AcademicLevel, string>> = {};
  for (const level of ACADEMIC_LEVELS) {
    const message = optionalAmount(fees[level] ?? "", LEVEL_LABELS[level]);
    if (message) feeErrors[level] = message;
  }
  const hasFeeErrors = Object.keys(feeErrors).length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffList, feeList] = await Promise.all([
        api.get<StaffRow[]>("/staff"),
        api.get<LevelFeeRow[]>("/settings/fees"),
      ]);
      setStaff(staffList);
      const feeMap: Record<string, string> = {};
      for (const row of feeList) {
        feeMap[row.level] = String(Number(row.amount));
      }
      setFees(feeMap);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't load settings. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function handleDeactivate(row: StaffRow) {
    Alert.alert("Deactivate staff", `Deactivate ${row.username}? They will no longer be able to sign in.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Deactivate",
        style: "destructive",
        onPress: async () => {
          try {
            await api.patch(`/staff/${row.id}/deactivate`);
            load();
          } catch (err) {
            Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't deactivate staff.");
          }
        },
      },
    ]);
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

  async function handleSaveFees(): Promise<boolean> {
    if (hasFeeErrors) return false;
    setSavingFees(true);
    try {
      const payload = {
        fees: ACADEMIC_LEVELS.map((level) => ({ level, amount: Number(fees[level] ?? 0) })),
      };
      await api.put("/settings/fees", payload);
      load();
      return true;
    } catch (err) {
      Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't save fee schedule.");
      return false;
    } finally {
      setSavingFees(false);
    }
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
        className="w-full p-4 md:mx-auto md:max-w-4xl md:p-6 lg:max-w-5xl"
      >
        <Text variant="heading" className="mb-1">
          Settings
        </Text>
        <BrandMark className="mb-4" />

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        {/* Staff accounts column alongside Fee schedule + Term once there's
            room; everything stacks on phone. */}
        <View className="flex-col gap-4 md:flex-row md:items-start">
          <Card className="relative mb-4 overflow-hidden md:mb-0 md:flex-1">
            <DecorativeShapes tone="info" />
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-info-100">
                    <Users size={16} color="#2563EB" />
                  </View>
                  <CardTitle>Staff accounts</CardTitle>
                </View>
                <Button size="sm" onPress={() => router.push("/admin/settings/new-staff")}>
                  <UserPlus size={14} color="#fff" />
                  <Text className="ml-1.5 font-body-semibold text-sm text-white">Add staff</Text>
                </Button>
              </View>
            </CardHeader>
            <CardContent>
              {loading && staff.length === 0 ? (
                <SkeletonList rows={4} />
              ) : staff.length === 0 ? (
                <Text variant="muted">No staff accounts yet.</Text>
              ) : (
                staffPag.pageItems.map((row, i) => {
                  const isRoot = row.username === ROOT_ADMIN_USERNAME;
                  return (
                    <View key={row.id}>
                      {i > 0 ? <Separator className="my-2" /> : null}
                      <View className="flex-row items-center justify-between">
                        <View>
                          <View className="flex-row items-center gap-1.5">
                            <Text className="font-body-medium">{row.username}</Text>
                            {isRoot ? <Badge variant="warning">Root</Badge> : null}
                          </View>
                          <Text variant="muted">{row.role}</Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                          <Badge variant={row.active ? "success" : "default"}>
                            {row.active ? "Active" : "Inactive"}
                          </Badge>
                          {row.active && !isRoot ? (
                            <Button size="sm" variant="ghost" onPress={() => handleDeactivate(row)}>
                              Deactivate
                            </Button>
                          ) : null}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </CardContent>
            <Pagination
              page={staffPag.page}
              totalPages={staffPag.totalPages}
              hasPrev={staffPag.hasPrev}
              hasNext={staffPag.hasNext}
              onPrev={staffPag.prev}
              onNext={staffPag.next}
              total={staffPag.total}
              className="border-t-0"
            />
          </Card>

          <View className="flex-1 gap-4">
            <Card className="relative overflow-hidden">
              <DecorativeShapes tone="gold" />
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-gold-100">
                    <Wallet size={16} color="#A37A1D" />
                  </View>
                  <CardTitle>Fee schedule</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                <Text variant="muted" className="mb-3">
                  Tap a grade to set its per-term fee.
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {ACADEMIC_LEVELS.map((level, i) => {
                    const amount = Number(fees[level] ?? 0);
                    const isSet = amount > 0;
                    return (
                      <MotiView
                        key={level}
                        from={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "timing", duration: 220, delay: i * 18 }}
                        className="w-[47%] md:w-[31%]"
                      >
                        <Pressable
                          onPress={() => setEditingLevel(level)}
                          className={`active:opacity-70 rounded-xl border p-3 ${
                            isSet ? "border-gold-200 bg-gold-50" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <Text className="font-body-semibold text-sm text-slate-900">{LEVEL_LABELS[level]}</Text>
                          <Text
                            className={`mt-1 font-heading-semibold text-lg ${
                              isSet ? "text-gold-700" : "text-slate-400"
                            }`}
                          >
                            {isSet ? `$${amount.toFixed(2)}` : "Not set"}
                          </Text>
                        </Pressable>
                      </MotiView>
                    );
                  })}
                </View>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <DecorativeShapes tone="violet" />
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                    <Calendar size={16} color="#7C3AED" />
                  </View>
                  <CardTitle>Term</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                <Text variant="muted" className="mb-4">
                  Starting a new term snapshots the current fee schedule for future payments. Use this at the start
                  of each school term.
                </Text>
                <StartNewTermButton onStarted={load} />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-danger-100">
                    <LogOut size={16} color="#DC2626" />
                  </View>
                  <CardTitle>Account</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                <Text variant="muted" className="mb-4">
                  Signed in as an admin. Logging out will require signing back in to access this app.
                </Text>
                <Button variant="destructive" onPress={handleLogout}>
                  <LogOut size={16} color="#fff" />
                  <Text className="ml-2 font-body-semibold text-base text-white">Log out</Text>
                </Button>
              </CardContent>
            </Card>
          </View>
        </View>
      </MotiView>

      {/* Single-grade fee editor — replaces showing all 15 grades' inputs at
          once, which buried the handful the admin actually needed to change
          under a wall of mostly-zero fields. */}
      <Modal
        visible={editingLevel !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingLevel(null)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 p-6">
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 180 }}
            className="w-full max-w-sm rounded-2xl bg-white p-5"
          >
            {editingLevel ? (
              <>
                <Text className="mb-1 font-heading-semibold text-lg text-slate-900">{LEVEL_LABELS[editingLevel]}</Text>
                <Text variant="muted" className="mb-4">
                  Set the per-term fee for this grade.
                </Text>
                <Label>Fee amount</Label>
                <Input
                  autoFocus
                  value={fees[editingLevel] ?? ""}
                  onChangeText={(v) => setFees((prev) => ({ ...prev, [editingLevel]: v }))}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                />
                {feeErrors[editingLevel] ? (
                  <Text className="mt-1 text-xs font-body-medium text-danger-600">{feeErrors[editingLevel]}</Text>
                ) : null}
                <View className="mt-5 flex-row gap-3">
                  <Button variant="outline" className="flex-1" onPress={() => setEditingLevel(null)}>
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!!feeErrors[editingLevel]}
                    loading={savingFees}
                    onPress={async () => {
                      const ok = await handleSaveFees();
                      if (ok) setEditingLevel(null);
                    }}
                  >
                    <Check size={16} color="#fff" />
                    <Text className="ml-2 font-body-semibold text-base text-white">Save</Text>
                  </Button>
                </View>
              </>
            ) : null}
          </MotiView>
        </View>
      </Modal>
    </ScrollView>
  );
}
