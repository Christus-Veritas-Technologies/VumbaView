import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { MotiView } from "moti";
import { Receipt, Users, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FeeStatusBadge } from "@/components/fee-status-badge";
import { PendingSyncBadge } from "@/components/pending-sync-badge";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { BrandMark } from "@/components/brand-mark";
import { getStudentCache, listPaymentsCache, type PaymentCacheRow, type StudentCacheRow } from "@/lib/storage/db";
import { pullPaymentsForStudent } from "@/lib/sync";
import { LEVEL_LABELS } from "@/lib/types";
import { usePagination } from "@/lib/use-pagination";

export default function AdminStudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<StudentCacheRow | null>(null);
  const [payments, setPayments] = useState<PaymentCacheRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paymentsPag = usePagination(payments);

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
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
        className="w-full p-4 md:mx-auto md:max-w-3xl md:p-6 lg:max-w-4xl"
      >
        <View className="mb-1 flex-row items-center justify-between">
          <Text variant="heading">{student.fullName}</Text>
          {student.pendingSync ? <PendingSyncBadge /> : null}
        </View>
        <BrandMark className="mb-1" />
        <Text variant="muted" className="mb-4">
          {LEVEL_LABELS[student.level]}
          {student.admissionNo ? ` · Admission #${student.admissionNo}` : ""} · {student.status}
        </Text>

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        <View className="mb-4 flex-col gap-4 md:flex-row">
          <Card className="md:flex-1">
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Wallet size={16} color="#A37A1D" />
                <CardTitle>Term fees</CardTitle>
              </View>
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
                <Text className="font-body-semibold">${(student.feeBalance ?? 0).toFixed(2)}</Text>
              </View>
            </CardContent>
          </Card>

          <Card className="md:flex-1">
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <Users size={16} color="#A37A1D" />
                <CardTitle>Guardian contact</CardTitle>
              </View>
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
            <View className="flex-row items-center gap-2">
              <Receipt size={16} color="#A37A1D" />
              <CardTitle>Payment history</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <Text variant="muted">No payments recorded yet.</Text>
            ) : (
              paymentsPag.pageItems.map((p, i) => (
                <View key={p.id}>
                  {i > 0 ? <Separator className="my-2" /> : null}
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text>{p.category}</Text>
                      <Text variant="muted">{p.occurredAt ? new Date(p.occurredAt).toLocaleDateString() : ""}</Text>
                    </View>
                    <Text className="font-body-semibold">${p.amount.toFixed(2)}</Text>
                  </View>
                </View>
              ))
            )}
          </CardContent>
          <Pagination
            page={paymentsPag.page}
            totalPages={paymentsPag.totalPages}
            hasPrev={paymentsPag.hasPrev}
            hasNext={paymentsPag.hasNext}
            onPrev={paymentsPag.prev}
            onNext={paymentsPag.next}
            total={paymentsPag.total}
            className="border-t-0"
          />
        </Card>
      </MotiView>
    </ScrollView>
  );
}
