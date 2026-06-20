import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { PendingSyncBadge } from "@/components/pending-sync-badge";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { getStudentCache, listPaymentsCache, type PaymentCacheRow, type StudentCacheRow } from "@/lib/storage/db";
import { pullPaymentsForStudent } from "@/lib/sync";
import { LEVEL_LABELS } from "@/lib/types";

export default function AdminStudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<StudentCacheRow | null>(null);
  const [payments, setPayments] = useState<PaymentCacheRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    try {
      setStudent(getStudentCache(id));
      setPayments(listPaymentsCache(id));
      setError(null);
    } catch {
      setError("Couldn't load this student from the local cache.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleRefresh() {
    if (!id) return;
    setRefreshing(true);
    try {
      await pullPaymentsForStudent(id);
    } catch {
      setError("Couldn't refresh payments — showing the last synced data.");
    } finally {
      load();
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-white">
        <LoadingState label="Loading student…" />
      </View>
    );
  }

  if (!student) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <ErrorState message={error ?? "Student not found in the local cache."} onRetry={load} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      <View className="w-full p-4 md:mx-auto md:max-w-3xl md:p-6 lg:max-w-4xl">
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="heading">{student.fullName}</Text>
          {student.pendingSync ? <PendingSyncBadge /> : null}
        </View>
        <Text variant="muted" className="mb-4">
          {LEVEL_LABELS[student.level]}
          {student.admissionNo ? ` · Admission #${student.admissionNo}` : ""} · {student.status}
        </Text>

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        <View className="mb-4 flex-col gap-4 md:flex-row">
          <Card className="md:flex-1">
            <CardHeader>
              <CardTitle>Term fees</CardTitle>
            </CardHeader>
            <CardContent>
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="muted">Status</Text>
                {student.feeStatus ? <FeeStatusBadge status={student.feeStatus} /> : null}
              </View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="muted">Fee amount</Text>
                <Text>${(student.feeAmount ?? 0).toFixed(2)}</Text>
              </View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text variant="muted">Paid</Text>
                <Text>${(student.feePaid ?? 0).toFixed(2)}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text variant="muted">Balance</Text>
                <Text className="font-semibold">${(student.feeBalance ?? 0).toFixed(2)}</Text>
              </View>
            </CardContent>
          </Card>

          <Card className="md:flex-1">
            <CardHeader>
              <CardTitle>Guardian contact</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="mb-1">{student.guardianName || "—"}</Text>
              <Text variant="muted" className="mb-1">
                {student.guardianPhone || "—"}
              </Text>
              <Text variant="muted" className="mb-1">
                {student.guardianEmail || "—"}
              </Text>
              <Text variant="muted">{student.guardianAddress || "—"}</Text>
            </CardContent>
          </Card>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Payment history</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <Text variant="muted">No payments recorded yet.</Text>
            ) : (
              payments.map((p, i) => (
                <View key={p.id}>
                  {i > 0 ? <Separator className="my-2" /> : null}
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text>{p.category}</Text>
                      <Text variant="muted">{p.occurredAt ? new Date(p.occurredAt).toLocaleDateString() : ""}</Text>
                    </View>
                    <Text className="font-semibold">${p.amount.toFixed(2)}</Text>
                  </View>
                </View>
              ))
            )}
          </CardContent>
        </Card>
      </View>
    </ScrollView>
  );
}
