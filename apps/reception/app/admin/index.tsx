import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RefreshControl, ScrollView, View } from "react-native";
import { MotiView } from "moti";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Rect, Stop } from "react-native-svg";
import { Activity, GraduationCap, MessageCircleHeart, UserPlus, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Pagination } from "@/components/ui/pagination";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { api, ApiClientError } from "@/lib/api";
import { notifyNewActivity } from "@/lib/notifications";
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
  type: "STUDENT_ADDED" | "PAYMENT_RECORDED" | "INQUIRY_RECEIVED";
  at: string;
  summary: string;
  by: string;
}

const ACTIVITY_ICON: Record<ActivityItem["type"], { Icon: typeof UserPlus; badge: string; tint: string }> = {
  STUDENT_ADDED: { Icon: UserPlus, badge: "bg-info-100", tint: "#2563EB" },
  PAYMENT_RECORDED: { Icon: Wallet, badge: "bg-gold-100", tint: "#A37A1D" },
  INQUIRY_RECEIVED: { Icon: MessageCircleHeart, badge: "bg-violet-100", tint: "#7C3AED" },
};

/** Gold-gradient hero banner — the dashboard's "vumba sunset" moment, mirroring
 * the sign-in screen's background treatment so the brand feel carries through
 * past login instead of disappearing into a flat white app shell. */
function DashboardHero({ termNumber, collected, expected }: { termNumber: number; collected: number; expected: number }) {
  const pct = expected > 0 ? Math.min(100, Math.round((collected / expected) * 100)) : 0;

  return (
    <View className="relative mb-5 overflow-hidden rounded-3xl">
      <View pointerEvents="none" className="absolute inset-0">
        <Svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <SvgGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#D2A93F" />
              <Stop offset="0.55" stopColor="#A37A1D" />
              <Stop offset="1" stopColor="#5B4517" />
            </SvgGradient>
          </Defs>
          <Rect x={0} y={0} width={400} height={160} fill="url(#heroGrad)" />
          <Circle cx={364} cy={16} r={74} fill="#FFFFFF" opacity={0.08} />
          <Circle cx={34} cy={146} r={52} fill="#FFFFFF" opacity={0.07} />
        </Svg>
      </View>

      <View className="p-5 md:p-6">
        <Text className="font-body-medium text-sm text-gold-100">Term {termNumber}</Text>
        <Text className="mt-1 font-heading-extrabold text-2xl text-white">Dashboard</Text>

        <View className="mt-5 flex-row items-end justify-between">
          <View>
            <Text className="font-body-medium text-xs text-gold-100">Collected this term</Text>
            <Text className="font-heading-semibold text-3xl text-white">${collected.toFixed(2)}</Text>
          </View>
          <View className="items-end">
            <Text className="font-body-semibold text-base text-white">{pct}%</Text>
            <Text className="font-body text-xs text-gold-100">of ${expected.toFixed(2)}</Text>
          </View>
        </View>

        <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
          <View className="h-1.5 rounded-full bg-white" style={{ width: `${pct}%` }} />
        </View>
      </View>
    </View>
  );
}

export default function AdminDashboardScreen() {
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [fees, setFees] = useState<FeesData | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activityPag = usePagination(activity);
  // Tracks activity keys already seen so a notification only fires for
  // genuinely new events — not for the first load, and not again on every
  // re-focus/pull-to-refresh of the same data.
  const seenActivityKeys = useRef<Set<string> | null>(null);

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

      const keys = a.map((item) => `${item.type}-${item.at}`);
      if (seenActivityKeys.current) {
        const newItems = a.filter((item, i) => !seenActivityKeys.current!.has(keys[i]));
        if (newItems.length > 0) notifyNewActivity(newItems);
      }
      seenActivityKeys.current = new Set(keys);
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
      <View className="w-full p-4 md:mx-auto md:max-w-3xl md:p-6 lg:max-w-4xl">
        <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 260 }}>
          <DashboardHero
            termNumber={fees?.term.number ?? 1}
            collected={fees?.collected ?? 0}
            expected={fees?.expected ?? 0}
          />
        </MotiView>

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        {/* Term fees + Enrollment sit side-by-side once there's room. */}
        <View className="mb-4 flex-col gap-4 md:flex-row">
          {fees ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 260, delay: 80 }}
              className="md:flex-1"
            >
              <Card className="relative overflow-hidden">
                <DecorativeShapes tone="gold" />
                <CardHeader>
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-gold-100">
                      <Wallet size={16} color="#A37A1D" />
                    </View>
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
            </MotiView>
          ) : null}

          {enrollment ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 260, delay: 160 }}
              className="md:flex-1"
            >
              <Card className="relative overflow-hidden">
                <DecorativeShapes tone="info" />
                <CardHeader>
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-info-100">
                      <GraduationCap size={16} color="#2563EB" />
                    </View>
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
            </MotiView>
          ) : null}
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 260, delay: 240 }}
        >
          <Card className="relative overflow-hidden">
            <DecorativeShapes tone="violet" />
            <CardHeader>
              <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                  <Activity size={16} color="#7C3AED" />
                </View>
                <CardTitle>Recent activity</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <Text variant="muted">No recent activity.</Text>
              ) : (
                activityPag.pageItems.map((item, i) => {
                  const { Icon, badge, tint } = ACTIVITY_ICON[item.type];
                  return (
                    <View key={`${item.type}-${item.at}-${i}`}>
                      {i > 0 ? <Separator className="my-2" /> : null}
                      <View className="flex-row items-center gap-3">
                        <View className={`h-9 w-9 items-center justify-center rounded-full ${badge}`}>
                          <Icon size={15} color={tint} />
                        </View>
                        <View className="flex-1">
                          <Text>{item.summary}</Text>
                          <Text variant="muted">
                            {item.by} · {new Date(item.at).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
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
      </View>
    </ScrollView>
  );
}
