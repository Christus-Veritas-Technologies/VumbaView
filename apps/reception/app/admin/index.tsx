import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RefreshControl, ScrollView, View } from "react-native";
import { MotiView } from "moti";
import { Activity, GraduationCap, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { api, ApiClientError } from "@/lib/api";
import { LEVEL_LABELS, type AcademicLevel } from "@/lib/types";
import { usePagination } from "@/lib/use-pagination";

interface EnrollmentData {
  total: number;
  byLevel: { level: AcademicLevel; count: number }[];
}

interface FeesData {
  term: { id: string; number: number };
  expected: number;
  collected: number;
  outstanding: number;
}

interface ActivityItem {
  type: "STUDENT_ADDED" | "PAYMENT_RECORDED";
  at: string;
  summary: string;
  by: string;
}

export default function AdminDashboardScreen() {
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [fees, setFees] = useState<FeesData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activityPag = usePagination(activity);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, f, a] = await Promise.all([
        api.get<EnrollmentData>("/dashboard/enrollment"),
        api.get<FeesData>("/dashboard/fees"),
        api.get<ActivityItem[]>("/dashboard/activity"),
      ]);
      setEnrollment(e);
      setFees(f);
      setActivity(a);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't load dashboard. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && !fees && !enrollment && !error) {
    return (
      <View className="flex-1 bg-slate-50">
        <LoadingState label="Loading dashboard…" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      {/* Full-width on phone; capped and centered on tablet/desktop. */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 280 }}
        className="w-full p-4 md:mx-auto md:max-w-3xl md:p-6 lg:max-w-4xl"
      >
        <Text variant="heading" className="mb-4">
          Dashboard
        </Text>

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        {/* Term fees + Enrollment sit side-by-side once there's room. */}
        <View className="mb-4 flex-col gap-4 md:flex-row">
          {fees ? (
            <Card className="md:flex-1">
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <Wallet size={16} color="#A37A1D" />
                  <CardTitle>Term {fees.term.number} fees</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="muted">Expected</Text>
                  <Text className="font-body-semibold">${fees.expected.toFixed(2)}</Text>
                </View>
                <View className="mb-2 flex-row items-center justify-between">
                  <Text variant="muted">Collected</Text>
                  <Text className="font-body-semibold text-success-700">${fees.collected.toFixed(2)}</Text>
                </View>
                <View className="flex-row items-center justify-between">
                  <Text variant="muted">Outstanding</Text>
                  <Text className="font-body-semibold text-danger-700">${fees.outstanding.toFixed(2)}</Text>
                </View>
              </CardContent>
            </Card>
          ) : null}

          {enrollment ? (
            <Card className="md:flex-1">
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <GraduationCap size={16} color="#A37A1D" />
                  <CardTitle>Enrollment — {enrollment.total} active</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                {enrollment.byLevel.map((row, i) => (
                  <View key={row.level}>
                    {i > 0 ? <Separator className="my-2" /> : null}
                    <View className="flex-row items-center justify-between">
                      <Text variant="muted">{LEVEL_LABELS[row.level]}</Text>
                      <Text>{row.count}</Text>
                    </View>
                  </View>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </View>

        <Card>
          <CardHeader>
            <View className="flex-row items-center gap-2">
              <Activity size={16} color="#A37A1D" />
              <CardTitle>Recent activity</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <Text variant="muted">No recent activity.</Text>
            ) : (
              activityPag.pageItems.map((item, i) => (
                <View key={`${item.type}-${item.at}-${i}`}>
                  {i > 0 ? <Separator className="my-2" /> : null}
                  <Text>{item.summary}</Text>
                  <Text variant="muted">
                    {item.by} · {new Date(item.at).toLocaleString()}
                  </Text>
                </View>
              ))
            )}
          </CardContent>
          <Pagination
            page={activityPag.page}
            totalPages={activityPag.totalPages}
            hasPrev={activityPag.hasPrev}
            hasNext={activityPag.hasNext}
            onPrev={activityPag.prev}
            onNext={activityPag.next}
            total={activityPag.total}
            className="border-t-0"
          />
        </Card>
      </MotiView>
    </ScrollView>
  );
}
