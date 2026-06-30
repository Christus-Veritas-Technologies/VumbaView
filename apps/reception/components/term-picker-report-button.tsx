import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from "react-native";
import { FileDown } from "lucide-react-native";
import { MotiView } from "moti";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiClientError } from "@/lib/api";
import { useReportDownload } from "@/lib/use-report-download";

interface TermOption {
  id: string;
  number: number;
  isCurrent: boolean;
  startedAt: string;
}

function formatTermDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export interface TermPickerReportButtonProps {
  /** Server report endpoint, e.g. "/reports/profit-loss". Term ID is appended as ?termId=xxx. */
  path: string;
  /** Used to build a unique local filename, e.g. "income-statement". */
  filenamePrefix: string;
  label?: string;
}

/**
 * Like ReportButton, but instead of a date-range picker the admin chooses
 * which term to generate the report for. The current term is highlighted
 * and pre-selected; older terms scroll below it.
 */
export function TermPickerReportButton({
  path,
  filenamePrefix,
  label = "Download PDF",
}: TermPickerReportButtonProps) {
  const [visible, setVisible] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [terms, setTerms] = useState<TermOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const report = useReportDownload();

  function loadTerms() {
    setTermsLoading(true);
    setTermsError(null);
    api
      .get<TermOption[]>("/terms")
      .then((list) => {
        setTerms(list);
        // Default to current term; fall back to most-recent.
        const current = list.find((t) => t.isCurrent) ?? list[0] ?? null;
        setSelectedId(current?.id ?? null);
      })
      .catch((err) => {
        setTermsError(err instanceof ApiClientError ? err.message : "Couldn't load terms.");
      })
      .finally(() => setTermsLoading(false));
  }

  function open() {
    setVisible(true);
    report.clearError();
    loadTerms();
  }

  async function handleGenerate() {
    if (!selectedId) return;
    const ok = await report.download(path, { termId: selectedId }, `${filenamePrefix}-${Date.now()}.pdf`);
    if (ok) setVisible(false);
  }

  return (
    <>
      <Button onPress={open}>{label}</Button>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <Pressable className="absolute inset-0" onPress={() => setVisible(false)} />
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="mb-4 items-center">
              <View className="mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
              <Text variant="subheading">{label}</Text>
              <Text variant="muted" className="mt-1 text-center text-xs">
                Choose which term to generate the Income Statement for.
              </Text>
            </View>

            {termsLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#A37A1D" />
              </View>
            ) : termsError ? (
              <ErrorState message={termsError} onRetry={loadTerms} />
            ) : terms.length === 0 ? (
              <View className="items-center py-6">
                <Text variant="muted">No terms found. Start a term first in Settings.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false} className="mb-4">
                {terms.map((t, i) => {
                  const selected = t.id === selectedId;
                  return (
                    <MotiView
                      key={t.id}
                      from={{ opacity: 0, translateY: 4 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{ type: "timing", duration: 180, delay: i * 30 }}
                    >
                      <Pressable
                        onPress={() => setSelectedId(t.id)}
                        className={`mb-2 flex-row items-center justify-between rounded-2xl border px-4 py-3 active:opacity-70 ${
                          selected
                            ? "border-gold-400 bg-gold-50"
                            : "border-slate-200 bg-white"
                        }`}
                      >
                        <View>
                          <View className="flex-row items-center gap-2">
                            <Text
                              className={`font-body-semibold text-sm ${selected ? "text-gold-800" : "text-slate-900"}`}
                            >
                              Term #{t.number}
                            </Text>
                            {t.isCurrent ? (
                              <View className="rounded-full bg-success-100 px-2 py-0.5">
                                <Text className="font-body-semibold text-xs text-success-700">Current</Text>
                              </View>
                            ) : null}
                          </View>
                          <Text variant="muted" className="mt-0.5 text-xs">
                            Started {formatTermDate(t.startedAt)}
                          </Text>
                        </View>
                        <View
                          className={`h-5 w-5 rounded-full border-2 ${
                            selected ? "border-gold-500 bg-gold-500" : "border-slate-300 bg-white"
                          }`}
                        >
                          {selected ? (
                            <View className="flex-1 items-center justify-center">
                              <View className="h-2 w-2 rounded-full bg-white" />
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                    </MotiView>
                  );
                })}
              </ScrollView>
            )}

            {report.error ? <ErrorState message={report.error} onRetry={handleGenerate} className="mb-3" /> : null}

            <Button
              loading={report.downloading}
              disabled={!selectedId || termsLoading}
              onPress={handleGenerate}
            >
              <FileDown size={16} color="#fff" />
              <Text className="ml-2 font-body-semibold text-base text-white">Generate PDF</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
