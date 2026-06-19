import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Compass, HeartHandshake, ShieldCheck, Target } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Academic Excellence",
    body: "We set high expectations in every subject and support each learner with the attention to reach them, from ECD through A-Level.",
  },
  {
    icon: ShieldCheck,
    title: "Integrity",
    body: "We teach students to do the right thing when no one is watching — in the classroom, on the sports field, and at home.",
  },
  {
    icon: HeartHandshake,
    title: "Community",
    body: "VumbaView is a close-knit family of students, parents, and staff who look out for one another, term after term.",
  },
  {
    icon: Compass,
    title: "Resilience",
    body: "Like the Bvumba mist that gives way to clear views, we teach our students to work patiently through setbacks toward their goals.",
  },
] as const;

export function MissionVisionValues() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Mission, Vision & Values"
          title="What we stand for,"
          accent="in and out of the classroom"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <div
              key={value.title}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <value.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{value.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
