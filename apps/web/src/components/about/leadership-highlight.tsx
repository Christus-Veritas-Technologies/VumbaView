import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";

const leaders = [
  { name: "Mr. Chimahi", title: "Head of School" },
  { name: "Mr. Farai Mutasa", title: "Deputy Head — Academics" },
  { name: "Mrs. Ruvimbo Sithole", title: "Head of Sixth Form" },
  { name: "Mr. Blessing Nyathi", title: "Head of Pastoral Care" },
] as const;

// No individual staff headshots exist yet, so leaders are shown with an
// initials badge rather than a photo — the real photos we have are candid
// group shots of students and would misrepresent a specific named staff
// member if used as a portrait. Swap in real headshots here once available.
function initials(name: string) {
  return name
    .replace(/^(Mrs\.|Mr\.|Ms\.|Dr\.)\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function LeadershipHighlight() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Our Leadership"
            title="The team behind"
            accent="every VumbaView learner"
          />
        </Reveal>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => (
            <StaggerItem key={leader.name} className="flex flex-col items-center gap-3 text-center">
              <div className="flex size-28 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                {initials(leader.name)}
              </div>
              <h3 className="text-sm font-semibold text-foreground">{leader.name}</h3>
              <p className="text-xs text-muted-foreground">{leader.title}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
