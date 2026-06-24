import { useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { FileDown } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { fetchReportBounds, ReportError, type ReportScope } from "@/lib/reports";
import { useReportDownload } from "@/lib/use-report-download";
import { cn } from "@/lib/utils";

function formatPickerLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export interface ReportButtonProps {
  /** Which dataset this report covers — drives the dynamic /reports/bounds lookup. */
  scope: ReportScope;
  /** Server report endpoint, e.g. "/reports/students". */
  path: string;
  /** Used to build a unique local filename, e.g. "all-students" -> "all-students-<ts>.pdf". */
  filenamePrefix: string;
  label?: string;
  className?: string;
}

/**
 * The "Generate Report" trigger used on the Dashboard, Students, and
 * Payments admin pages. Tapping it opens a bottom sheet where the admin
 * picks a start/end date — bounded by the earliest/latest date actually
 * present in that page's own data (never hardcoded, see lib/reports.ts).
 * Generating shows a loading state immediately, an inline error with retry
 * if it fails, and opens the OS share/save sheet on success.
 */
export function ReportButton({ scope, path, filenamePrefix, label = "Generate Report", className }: ReportButtonProps) {
  const [visible, setVisible] = useState(false);
  const [boundsLoading, setBoundsLoading] = useState(false);
  const [boundsError, setBoundsError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<Date | null>(null);
  const [maxDate, setMaxDate] = useState<Date | null>(null);
  const [from, setFrom] = useState<Date>(new Date());
  const [to, setTo] = useState<Date>(new Date());
  const [activePicker, setActivePicker] = useState<"from" | "to" | null>(null);
  const report = useReportDownload();

  function loadBounds() {
    setBoundsLoading(true);
    setBoundsError(null);
    fetchReportBounds(scope)
      .then((bounds) => {
        const earliest = bounds.earliest ? new Date(bounds.earliest) : new Date();
        const latest = bounds.latest ? new Date(bounds.latest) : new Date();
        setMinDate(earliest);
        setMaxDate(latest);
        setFrom(earliest);
        setTo(latest);
      })
      .catch((err) => {
        setBoundsError(err instanceof ReportError ? err.message : "Couldn't load the available date range.");
      })
      .finally(() => setBoundsLoading(false));
  }

  function open() {
    setVisible(true);
    report.clearError();
    loadBounds();
  }

  async function handleGenerate() {
    const ok = await report.download(
      path,
      { from: from.toISOString(), to: to.toISOString() },
      `${filenamePrefix}-${Date.now()}.pdf`,
    );
    if (ok) setVisible(false);
  }

  function handlePickerChange(which: "from" | "to", event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setActivePicker(null);
    if (event.type === "dismissed" || !selected) return;
    if (which === "from") setFrom(selected);
    else setTo(selected);
  }

  return (
    <>
      <Pressable
        onPress={open}
        className={cn("flex-row items-center gap-1.5 rounded-full bg-gold-100 px-3 py-1.5 active:bg-gold-200", className)}
      >
        <FileDown size={14} color="#A37A1D" />
        <Text className="font-body-semibold text-xs text-gold-700">{label}</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setVisible(false)} />
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="mb-4 items-center">
              <View className="mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
              <Text variant="subheading">{label}</Text>
            </View>

            {boundsLoading ? (
              <View className="items-center py-6">
                <ActivityIndicator color="#A37A1D" />
              </View>
            ) : boundsError ? (
              <ErrorState message={boundsError} onRetry={loadBounds} />
            ) : (
              <>
                <Text variant="muted" className="mb-3">
                  Data is available from {minDate ? formatPickerLabel(minDate) : "—"} to{" "}
                  {maxDate ? formatPickerLabel(maxDate) : "—"}. Choose the range to include.
                </Text>

                <View className="mb-3 flex-row gap-3">
                  <Pressable
                    onPress={() => setActivePicker("from")}
                    className="flex-1 rounded-2xl border border-slate-200 p-3"
                  >
                    <Text variant="label" className="text-slate-500">
                      From
                    </Text>
                    <Text className="font-body-semibold">{formatPickerLabel(from)}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setActivePicker("to")}
                    className="flex-1 rounded-2xl border border-slate-200 p-3"
                  >
                    <Text variant="label" className="text-slate-500">
                      To
                    </Text>
                    <Text className="font-body-semibold">{formatPickerLabel(to)}</Text>
                  </Pressable>
                </View>

                {activePicker ? (
                  <DateTimePicker
                    value={activePicker === "from" ? from : to}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    minimumDate={minDate ?? undefined}
                    maximumDate={maxDate ?? undefined}
                    onChange={(event, selected) => handlePickerChange(activePicker, event, selected)}
                  />
                ) : null}

                {report.error ? (
                  <ErrorState message={report.error} onRetry={handleGenerate} className="mt-3" />
                ) : null}

                <Button loading={report.downloading} onPress={handleGenerate} className="mt-4">
                  <FileDown size={16} color="#fff" />
                  <Text className="ml-2 font-body-semibold text-base text-white">Generate PDF</Text>
                </Button>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
