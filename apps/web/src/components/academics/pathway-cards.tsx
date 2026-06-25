import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { academicLevels } from "@/lib/site-config";
import { BookOpen, GraduationCap } from "lucide-react";

const icons = [BookOpen, GraduationCap];

export function PathwayCards() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            eyebrow="Curriculum Pathway"
            title="Form 1 to Form 6,"
            accent="one continuous standard"
            description="O-Level builds the foundation, A-Level sharpens it — one ZIMSEC pathway, with weekly assessment so no learner drifts off track."
          />
        </Reveal>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2">
          {academicLevels.map((level, index) => {
            const Icon = icons[index];
            return (
              <StaggerItem
                key={level.stage}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {Icon ? <Icon className="size-5" aria-hidden="true" /> : null}
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{level.stage}</h3>
                    <p className="text-xs font-medium tracking-wide text-accent uppercase">
                      {level.ageRange}
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {level.description}
                </p>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </Container>
    </section>
  );
}
