import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { Button } from "@vva/ui/components/button";
import Link from "next/link";

const pillars = [
  {
    title: "Our Mission",
    body: "To provide a rigorous, ZIMSEC-grounded education in a caring environment where every learner, from ECD to A-Level, is equipped to think clearly, act with integrity, and lead in their community.",
  },
  {
    title: "Our Vision",
    body: "To be Manicaland's most trusted school for academic results and character, sending confident graduates from Mutare into universities and workplaces across Zimbabwe and beyond.",
  },
] as const;

export function MissionVisionTeaser() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-10">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Mission & Vision"
            title="What drives us,"
            accent="every single day"
          />
        </Reveal>
        <StaggerGroup className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <StaggerItem
              key={pillar.title}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-8"
            >
              <h3 className="text-xl font-semibold text-primary">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
        <div className="flex justify-center">
          <Button render={<Link href="/about" />} variant="outline" className="h-11 rounded-full px-6">
            Read Our Full Story
          </Button>
        </div>
      </Container>
    </section>
  );
}
