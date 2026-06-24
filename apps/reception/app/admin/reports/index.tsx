import { ScrollView, View } from "react-native";
import { FileBarChart2, FileSpreadsheet, FileWarning } from "lucide-react-native";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { DecorativeShapes } from "@/components/decorative-shapes";
import { useReportDownload } from "@/lib/use-report-download";

interface TemplateConfig {
  key: string;
  title: string;
  description: string;
  path: string;
  filenamePrefix: string;
  icon: React.ReactNode;
  tone: "gold" | "info" | "violet";
  badgeClass: string;
}

const TEMPLATES: TemplateConfig[] = [
  {
    key: "balances",
    title: "Students with balances",
    description: "Every student who currently owes a fee balance, with amount owed and contact details.",
    path: "/reports/students-with-balances",
    filenamePrefix: "students-with-balances",
    icon: <FileWarning size={18} color="#A37A1D" />,
    tone: "gold",
    badgeClass: "bg-gold-100",
  },
  {
    key: "all-students",
    title: "All students",
    description: "The full student directory — enrollment, level, and fee status for every student on record.",
    path: "/reports/students",
    filenamePrefix: "all-students",
    icon: <FileSpreadsheet size={18} color="#2563EB" />,
    tone: "info",
    badgeClass: "bg-info-100",
  },
  {
    key: "all-payments",
    title: "All payments (full info)",
    description: "Every payment ever recorded — amount, discount, net cash collected, and who recorded it.",
    path: "/reports/payments",
    filenamePrefix: "all-payments",
    icon: <FileBarChart2 size={18} color="#7C3AED" />,
    tone: "violet",
    badgeClass: "bg-violet-100",
  },
];

/** One-tap trigger for a single fixed report template — no date range,
 * unlike the per-page "Generate Report" buttons. Shows a loading state the
 * instant it's tapped, an inline error with retry on failure, and opens the
 * OS share/save sheet on success (handled inside useReportDownload). */
function TemplateCard({ template }: { template: TemplateConfig }) {
  const report = useReportDownload();

  return (
    <Card className="relative mb-4 overflow-hidden">
      <DecorativeShapes tone={template.tone} />
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <View className={`h-9 w-9 items-center justify-center rounded-full ${template.badgeClass}`}>
            {template.icon}
          </View>
          <CardTitle>{template.title}</CardTitle>
        </View>
      </CardHeader>
      <CardContent>
        <Text variant="muted" className="mb-3">
          {template.description}
        </Text>
        {report.error ? <ErrorState message={report.error} className="mb-3" /> : null}
        <Button
          loading={report.downloading}
          onPress={() => report.download(template.path, undefined, `${template.filenamePrefix}-${Date.now()}.pdf`)}
        >
          Download PDF
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminReportsScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-50">
      <View className="w-full p-4 md:mx-auto md:max-w-2xl md:p-6">
        <Text variant="muted" className="mb-4">
          Generate a polished PDF for any of the three standard reports below — each pulls the latest data and
          opens your device's share/save sheet once it's ready.
        </Text>
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.key} template={t} />
        ))}
      </View>
    </ScrollView>
  );
}
