import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { academicLevels } from "@/lib/site-config";
import { Button } from "@vva/ui/components/button";
import { BookOpen, GraduationCap, Pencil, Sprout } from "lucide-react";
import Link from "next/link";

const icons = [Sprout, BookOpen, Pencil, GraduationCap];

export function AcademicPathwaysPreview() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Academic Pathways"
          title="One school,"
          accent="every stage of growing up"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {academicLevels.map((level, index) => {
            const Icon = icons[index];
            return (
              <div
                key={level.stage}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {Icon ? <Icon className="size-5" aria-hidden="true" /> : null}
                </span>
                <h3 className="text-base font-semibold text-foreground">{level.stage}</h3>
                <p className="text-xs font-medium tracking-wide text-accent uppercase">
                  {level.ageRange}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {level.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center">
          <Button render={<Link href="/academics" />} className="h-11 rounded-full bg-primary px-6 text-primary-foreground hover:bg-primary/90">
            Explore Academics
          </Button>
        </div>
      </Container>
    </section>
  );
}
