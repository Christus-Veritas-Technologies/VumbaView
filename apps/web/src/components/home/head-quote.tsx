import { Container } from "@/components/marketing/container";
import { Reveal } from "@/components/motion/reveal";
import { schoolFacts } from "@/lib/site-config";
import { Quote } from "lucide-react";

// No individual staff headshot exists yet, so this uses an initials badge
// rather than a real student photo — those are real candid group photos of
// students and would misrepresent a specific named staff member if used as
// a portrait. Swap in a real headshot here once one is available.
function initials(name: string) {
  return name
    .replace(/^(Mrs\.|Mr\.|Ms\.|Dr\.)\s*/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function HeadQuote() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="grid items-center gap-10 rounded-3xl bg-primary px-8 py-12 text-primary-foreground sm:px-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div className="mx-auto flex size-32 shrink-0 items-center justify-center rounded-full bg-accent text-3xl font-bold text-accent-foreground ring-4 ring-white/20 sm:size-40 sm:text-4xl">
            {initials(schoolFacts.headOfSchool.name)}
          </div>
          <div className="flex flex-col gap-4">
            <Quote className="size-8 text-accent" aria-hidden="true" />
            <p className="text-xl leading-relaxed font-medium sm:text-2xl">
              &ldquo;We tell every new family the same thing: VumbaView is not the easiest
              school, but it is the most caring. We hold our students to a high standard
              because Mutare and Zimbabwe will hold them to one too — and we want them
              ready.&rdquo;
            </p>
            <div>
              <p className="font-semibold">{schoolFacts.headOfSchool.name}</p>
              <p className="text-sm text-primary-foreground/70">
                {schoolFacts.headOfSchool.title}
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
