import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CalendarDays, CheckCircle2 } from "lucide-react";

const requirements = [
  "Completed admissions inquiry form",
  "Certified copy of birth certificate",
  "Most recent school report (if transferring)",
  "Two passport-size photographs",
  "Non-refundable assessment fee",
] as const;

const dates = [
  { label: "Term 1 Applications Open", value: "1 September" },
  { label: "Term 1 Applications Close", value: "30 November" },
  { label: "Assessments & Tours", value: "Ongoing, by appointment" },
  { label: "Term 1 Begins", value: "Second week of January" },
] as const;

export function RequirementsDates() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Requirements & Key Dates"
          title="What you'll need,"
          accent="and when to apply"
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8">
            <h3 className="text-base font-semibold text-foreground">Required Documents</h3>
            <ul className="flex flex-col gap-3">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-8">
            <h3 className="text-base font-semibold text-foreground">Key Dates</h3>
            <ul className="flex flex-col gap-3">
              {dates.map((item) => (
                <li key={item.label} className="flex items-start gap-3 text-sm">
                  <CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">{item.label}:</span> {item.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
