import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { Compass, HeartHandshake, ShieldCheck, Target } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Academic Excellence",
    body: "We set high expectations in every subject and support each learner with the attention to reach them, in every form from Form 1 to Form 6.",
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
    body: "Setbacks are part of every ZIMSEC journey. We teach our students to absorb a poor result, diagnose what went wrong, and come back stronger the next term.",
  },
] as const;

export function MissionVisionValues() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Mission, Vision & Values"
            title="What we stand for,"
            accent="in and out of the classroom"
          />
        </Reveal>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value) => (
            <StaggerItem
              key={value.title}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <value.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{value.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{value.body}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
