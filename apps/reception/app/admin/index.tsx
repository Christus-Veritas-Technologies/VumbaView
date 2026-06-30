import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { RefreshControl, ScrollView, View } from "react-native";
import { MotiView } from "moti";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Rect, Stop } from "react-native-svg";
import { Calendar, Clock, GraduationCap, Receipt, TrendingDown, UserPlus, Users, Wallet } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton, SkeletonList, SkeletonStatCard } from "@/components/ui/skeleton";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { StartNewTermButton } from "@/components/start-new-term-button";
import { ReportButton } from "@/components/report-button";
import { PeriodSelector, periodRange, type PeriodKey } from "@/components/period-selector";
import { api, ApiClientError } from "@/lib/api";
import { notifyNewActivity } from "@/lib/notifications";
import { LEVEL_LABELS, type AcademicLevel } from "@/lib/types";

interface PeriodData {
  from: string;
  to: string;
  newStudents: number;
  payments: { count: number; gross: number; discount: number; net: number };
}

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

interface SummaryData {
  studentsCount: number;
  paymentsCount: number;
  expensesCount: number;
  expensesTotal: number;
}

interface ActivityRow {
  id: string;
  type: "STUDENT_ADDED" | "PAYMENT_RECORDED";
  at: string;
  summary: string;
  by: string | null;
}

interface ActivityFeed {
  recentStudents: ActivityRow[];
  recentPayments: ActivityRow[];
}

const EMPTY_FEED: ActivityFeed = { recentStudents: [], recentPayments: [] };

/** Gold-gradient hero banner — the dashboard's "vumba sunset" moment, mirroring
 * the sign-in screen's background treatment so the brand feel carries through
 * past login instead of disappearing into a flat white app shell. */
function DashboardHero({
  termNumber,
  collected,
  expected,
  noTerm,
}: {
  termNumber?: number;
  collected: number;
  expected: number;
  noTerm?: boolean;
}) {
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
        <View className="flex-row items-start justify-between">
          <Text className="font-body-medium text-sm text-gold-100">{noTerm ? "No active term" : `Term ${termNumber}`}</Text>
          {/* Branding pill — present in both the active-term and no-term states. */}
          <View className="rounded-full bg-white px-2.5 py-1">
            <Text className="font-body-semibold text-[11px] text-danger-600">VumbaView Academy</Text>
          </View>
        </View>
        <Text className="mt-1 font-heading-extrabold text-2xl text-white">Dashboard</Text>

        {noTerm ? (
          <Text className="mt-5 font-body text-sm text-gold-100">
            Start a term below to begin tracking fees collected this period.
          </Text>
        ) : (
          <>
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
          </>
        )}
      </View>
    </View>
  );
}

function ActivityFeedCard({
  title,
  icon,
  tone,
  badgeClass,
  tint,
  rows,
  loading,
  emptyLabel,
}: {
  title: string;
  icon: React.ReactNode;
  tone: "info" | "violet";
  badgeClass: string;
  tint: string;
  rows: ActivityRow[];
  loading: boolean;
  emptyLabel: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <DecorativeShapes tone={tone} />
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <View className={`h-8 w-8 items-center justify-center rounded-full ${badgeClass}`}>{icon}</View>
          <CardTitle>{title}</CardTitle>
        </View>
      </CardHeader>
      <CardContent>
        {loading && rows.length === 0 ? (
          <SkeletonList rows={3} />
        ) : rows.length === 0 ? (
          <Text variant="muted">{emptyLabel}</Text>
        ) : (
          rows.map((item, i) => (
            <View key={item.id}>
              {i > 0 ? <Separator className="my-2" /> : null}
              <View className="flex-row items-center gap-3">
                <View className={`h-9 w-9 items-center justify-center rounded-full ${badgeClass}`}>
                  {item.type === "STUDENT_ADDED" ? (
                    <UserPlus size={15} color={tint} />
                  ) : (
                    <Wallet size={15} color={tint} />
                  )}
                </View>
                <View className="flex-1">
                  <Text>{item.summary}</Text>
                  <Text variant="muted">
                    {item.by ?? "—"} · {new Date(item.at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardScreen() {
  const [enrollment, setEnrollment] = useState<EnrollmentData | null>(null);
  const [fees, setFees] = useState<FeesData | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [activity, setActivity] = useState<ActivityFeed>(EMPTY_FEED);
  const [noTerm, setNoTerm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Tracks activity keys already seen so a notification only fires for
  // genuinely new events — not for the first load, and not again on every
  // re-focus/pull-to-refresh of the same data.
  const seenActivityKeys = useRef<Set<string> | null>(null);

  // Today/This Week/This Month quick filter — a rolling-window view backed
  // by GET /dashboard/period, deliberately separate from the term-scoped
  // `fees` figures above. "all" just hides this card again.
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [periodData, setPeriodData] = useState<PeriodData | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [periodError, setPeriodError] = useState<string | null>(null);

  const loadPeriod = useCallback((key: PeriodKey) => {
    if (key === "all") {
      setPeriodData(null);
      setPeriodError(null);
      return;
    }
    const { from, to } = periodRange(key);
    if (!from || !to) return;
    setPeriodLoading(true);
    setPeriodError(null);
    api
      .get<PeriodData>("/dashboard/period", { from: from.toISOString(), to: to.toISOString() })
      .then(setPeriodData)
      .catch((err) => setPeriodError(err instanceof ApiClientError ? err.message : "Couldn't load this period."))
      .finally(() => setPeriodLoading(false));
  }, []);

  function handlePeriodChange(key: PeriodKey) {
    setPeriod(key);
    loadPeriod(key);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [e, a, s] = await Promise.all([
        api.get<EnrollmentData>("/dashboard/enrollment"),
        api.get<ActivityFeed>("/dashboard/activity"),
        api.get<SummaryData>("/dashboard/summary"),
      ]);
      setEnrollment(e);
      setActivity(a);
      setSummary(s);

      const merged = [...a.recentStudents, ...a.recentPayments];
      const keys = merged.map((item) => `${item.type}-${item.id}`);
      if (seenActivityKeys.current) {
        const newItems = merged.filter((item, i) => !seenActivityKeys.current!.has(keys[i]));
        if (newItems.length > 0) {
          notifyNewActivity(newItems.map((item) => ({ ...item, by: item.by ?? "" })));
        }
      }
      seenActivityKeys.current = new Set(keys);

      // Term-dependent figures are fetched separately and on their own
      // try/catch — a "no term yet" 404 here shouldn't blank out everything
      // else on the dashboard, just switch this one section to the
      // encouragement-to-start-a-term card.
      try {
        const f = await api.get<FeesData>("/dashboard/fees");
        setFees(f);
        setNoTerm(false);
      } catch (feeErr) {
        if (feeErr instanceof ApiClientError && feeErr.status === 404) {
          setFees(null);
          setNoTerm(true);
        } else {
          throw feeErr;
        }
      }
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

  if (loading && !enrollment && !summary && !error) {
    return (
      <View className="flex-1 bg-slate-50">
        <View className="w-full p-4 md:mx-auto md:max-w-3xl md:p-6 lg:max-w-4xl">
          <Skeleton className="mb-5 h-40 w-full rounded-3xl" />
          <View className="mb-4 flex-col gap-4 md:flex-row">
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
          <View className="mb-4 flex-col gap-4 md:flex-row">
            <SkeletonStatCard />
            <SkeletonStatCard />
          </View>
          <View className="rounded-2xl border border-slate-100 bg-white p-4">
            <SkeletonList rows={3} />
          </View>
        </View>
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
            termNumber={fees?.term.number}
            collected={fees?.collected ?? 0}
            expected={fees?.expected ?? 0}
            noTerm={noTerm}
          />
        </MotiView>

        <View className="mb-4 flex-row items-center justify-between">
          <PeriodSelector value={period} onChange={handlePeriodChange} />
          <ReportButton scope="dashboard" path="/reports/dashboard" filenamePrefix="dashboard-snapshot" label="Report" />
        </View>

        {period !== "all" ? (
          <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: "timing", duration: 220 }}>
            <Card className="relative mb-4 overflow-hidden">
              <DecorativeShapes tone="violet" />
              <CardHeader>
                <View className="flex-row items-center gap-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                    <Clock size={16} color="#7C3AED" />
                  </View>
                  <CardTitle>{period === "today" ? "Last 24 hours" : period === "week" ? "This week" : "This month"}</CardTitle>
                </View>
              </CardHeader>
              <CardContent>
                {periodLoading ? (
                  <SkeletonList rows={2} />
                ) : periodError ? (
                  <ErrorState message={periodError} onRetry={() => loadPeriod(period)} />
                ) : periodData ? (
                  <>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text variant="muted">New students</Text>
                      <Text className="font-body-semibold">{periodData.newStudents}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text variant="muted">Payments made</Text>
                      <Text className="font-body-semibold">{periodData.payments.count}</Text>
                    </View>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text variant="muted">Gross collected</Text>
                      <Text className="font-body-semibold">${periodData.payments.gross.toFixed(2)}</Text>
                    </View>
                    {periodData.payments.discount > 0 ? (
                      <View className="mb-2 flex-row items-center justify-between">
                        <Text variant="muted">Discounts given</Text>
                        <Text className="font-body-semibold text-warning-700">
                          -${periodData.payments.discount.toFixed(2)}
                        </Text>
                      </View>
                    ) : null}
                    <View className="flex-row items-center justify-between">
                      <Text variant="muted">Net cash collected</Text>
                      <Text className="font-body-semibold text-success-700">${periodData.payments.net.toFixed(2)}</Text>
                    </View>
                  </>
                ) : null}
              </CardContent>
            </Card>
          </MotiView>
        ) : null}

        {error ? <ErrorState message={error} onRetry={load} className="mb-4" /> : null}

        {/* Students + Payments headline counts — meaningful with or without
            an active term, so they sit above the term-dependent cards. */}
        <View className="mb-4 flex-col gap-4 md:flex-row">
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 260, delay: 40 }}
            className="md:flex-1"
          >
            <Card className="overflow-hidden">
              <CardContent className="flex-row items-center gap-3 py-5">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-success-100">
                  <Users size={18} color="#16A34A" />
                </View>
                <View>
                  <Text className="font-heading-semibold text-2xl text-slate-900">{summary?.studentsCount ?? 0}</Text>
                  <Text variant="muted" className="text-xs">
                    Active students
                  </Text>
                </View>
              </CardContent>
            </Card>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 260, delay: 80 }}
            className="md:flex-1"
          >
            <Card className="overflow-hidden">
              <CardContent className="flex-row items-center gap-3 py-5">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-gold-100">
                  <Receipt size={18} color="#A37A1D" />
                </View>
                <View>
                  <Text className="font-heading-semibold text-2xl text-slate-900">{summary?.paymentsCount ?? 0}</Text>
                  <Text variant="muted" className="text-xs">
                    Payments made
                  </Text>
                </View>
              </CardContent>
            </Card>
          </MotiView>
        </View>

        {/* Expenses summary card — total count + total spend. */}
        <View className="mb-4">
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 260, delay: 100 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="flex-row items-center gap-3 py-5">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-danger-100">
                  <TrendingDown size={18} color="#DC2626" />
                </View>
                <View className="flex-1">
                  <Text className="font-heading-semibold text-2xl text-slate-900">
                    ${(summary?.expensesTotal ?? 0).toFixed(2)}
                  </Text>
                  <Text variant="muted" className="text-xs">
                    Total expenses · {summary?.expensesCount ?? 0} record{(summary?.expensesCount ?? 0) === 1 ? "" : "s"}
                  </Text>
                </View>
              </CardContent>
            </Card>
          </MotiView>
        </View>

        {/* Term fees + Enrollment sit side-by-side once there's room. */}
        <View className="mb-4 flex-col gap-4 md:flex-row">
          {noTerm ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 260, delay: 120 }}
              className="md:flex-1"
            >
              <Card className="relative overflow-hidden">
                <DecorativeShapes tone="gold" />
                <CardHeader>
                  <View className="flex-row items-center gap-2">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-gold-100">
                      <Calendar size={16} color="#A37A1D" />
                    </View>
                    <CardTitle>No active term</CardTitle>
                  </View>
                </CardHeader>
                <CardContent>
                  <Text variant="muted" className="mb-4">
                    Start a term to begin tracking fees collected this period. Once a term is active, this card
                    shows real collection figures.
                  </Text>
                  <StartNewTermButton onStarted={load} />
                </CardContent>
              </Card>
            </MotiView>
          ) : fees ? (
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 260, delay: 120 }}
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

        {/* New students + Recent payments — split into two natural-language
            feeds instead of one merged "recent activity" list. */}
        <View className="flex-col gap-4 md:flex-row">
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 260, delay: 200 }}
            className="md:flex-1"
          >
            <ActivityFeedCard
              title="New students"
              icon={<UserPlus size={16} color="#2563EB" />}
              tone="info"
              badgeClass="bg-info-100"
              tint="#2563EB"
              rows={activity.recentStudents}
              loading={loading}
              emptyLabel="No new students yet."
            />
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 260, delay: 240 }}
            className="md:flex-1"
          >
            <ActivityFeedCard
              title="Recent payments"
              icon={<Wallet size={16} color="#7C3AED" />}
              tone="violet"
              badgeClass="bg-violet-100"
              tint="#7C3AED"
              rows={activity.recentPayments}
              loading={loading}
              emptyLabel="No payments recorded yet."
            />
          </MotiView>
        </View>
      </View>
    </ScrollView>
  );
}
