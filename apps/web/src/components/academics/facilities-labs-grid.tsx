import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { Atom, Dumbbell, Laptop, Library, Microscope, Palette } from "lucide-react";

const facilities = [
  { icon: Microscope, label: "Science Laboratories" },
  { icon: Laptop, label: "Computer Lab" },
  { icon: Library, label: "Resource Library" },
  { icon: Dumbbell, label: "Sports Fields & Courts" },
  { icon: Palette, label: "Art & Music Rooms" },
  { icon: Atom, label: "STEM Workshop" },
] as const;

export function FacilitiesLabsGrid() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Facilities"
            title="Spaces that support"
            accent="every subject"
          />
        </Reveal>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => (
            <StaggerItem
              key={facility.label}
              className="flex items-center gap-4 rounded-3xl border border-border bg-card p-6"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <facility.icon className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm font-semibold text-foreground">{facility.label}</span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
