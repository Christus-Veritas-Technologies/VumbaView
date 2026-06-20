import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiClientError } from "@/lib/api";
import { ACADEMIC_LEVELS, LEVEL_LABELS, type AcademicLevel, type StaffRole } from "@/lib/types";

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
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [fees, setFees] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [savingFees, setSavingFees] = useState(false);
  const [startingTerm, setStartingTerm] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleSaveFees() {
    setSavingFees(true);
    try {
      const payload = {
        fees: ACADEMIC_LEVELS.map((level) => ({ level, amount: Number(fees[level] ?? 0) })),
      };
      await api.put("/settings/fees", payload);
      Alert.alert("Saved", "Fee schedule updated.");
      load();
    } catch (err) {
      Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't save fee schedule.");
    } finally {
      setSavingFees(false);
    }
  }

  function handleStartNewTerm() {
    Alert.alert(
      "Start new term",
      "This creates a new term and snapshots the current fee schedule. Past payments and fee balances are not affected. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start term",
          onPress: async () => {
            setStartingTerm(true);
            try {
              const term = await api.post<{ number: number }>("/settings/start-term");
              Alert.alert("Term started", `Term ${term.number} is now active.`);
            } catch (err) {
              Alert.alert("Error", err instanceof ApiClientError ? err.message : "Couldn't start new term.");
            } finally {
              setStartingTerm(false);
            }
          },
        },
      ],
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="w-full p-4 md:mx-auto md:max-w-4xl md:p-6 lg:max-w-5xl">
        <Text variant="heading" className="mb-4">
          Settings
        </Text>

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        {/* Staff accounts column alongside Fee schedule + Term once there's
            room; everything stacks on phone. */}
        <View className="flex-col gap-4 md:flex-row md:items-start">
          <Card className="mb-4 md:mb-0 md:flex-1">
            <CardHeader>
              <View className="flex-row items-center justify-between">
                <CardTitle>Staff accounts</CardTitle>
                <Button size="sm" onPress={() => router.push("/admin/settings/new-staff")}>
                  Add staff
                </Button>
              </View>
            </CardHeader>
            <CardContent>
              {staff.length === 0 ? (
                <Text variant="muted">{loading ? "Loading…" : "No staff accounts yet."}</Text>
              ) : (
                staff.map((row, i) => (
                  <View key={row.id}>
                    {i > 0 ? <Separator className="my-2" /> : null}
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="font-medium">{row.username}</Text>
                        <Text variant="muted">{row.role}</Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Badge variant={row.active ? "success" : "default"}>
                          {row.active ? "Active" : "Inactive"}
                        </Badge>
                        {row.active ? (
                          <Button size="sm" variant="ghost" onPress={() => handleDeactivate(row)}>
                            Deactivate
                          </Button>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))
              )}
            </CardContent>
          </Card>

          <View className="flex-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {ACADEMIC_LEVELS.map((level) => (
                  <View key={level} className="mb-3">
                    <Label>{LEVEL_LABELS[level]}</Label>
                    <Input
                      value={fees[level] ?? ""}
                      onChangeText={(v) => setFees((prev) => ({ ...prev, [level]: v }))}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                ))}
                <Button loading={savingFees} onPress={handleSaveFees}>
                  Save fee schedule
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Term</CardTitle>
              </CardHeader>
              <CardContent>
                <Text variant="muted" className="mb-4">
                  Starting a new term snapshots the current fee schedule for future payments. Use this at the start
                  of each school term.
                </Text>
                <Button variant="secondary" loading={startingTerm} onPress={handleStartNewTerm}>
                  Start new term
                </Button>
              </CardContent>
            </Card>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
