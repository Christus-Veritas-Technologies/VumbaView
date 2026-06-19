import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { images } from "@/lib/images";
import Image from "next/image";

const pillars = [
  {
    title: "Academics",
    body: "Core ZIMSEC subjects taught in small classes, with extra support periods for learners who need them and enrichment for those ready to go further.",
  },
  {
    title: "Character",
    body: "Weekly life-skills and guidance lessons, a student leadership council, and a clear code of conduct that students help enforce themselves.",
  },
  {
    title: "Co-Curricular",
    body: "Sport, music, debate, and clubs every learner is encouraged to join — because growth happens outside the classroom too.",
  },
] as const;

export function CurriculumPillars() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image
            src={images.teacherLecturing.src}
            alt={images.teacherLecturing.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-8">
          <SectionHeading
            eyebrow="Curriculum Pillars"
            title="More than"
            accent="exam results"
          />
          <div className="flex flex-col gap-6">
            {pillars.map((pillar) => (
              <div key={pillar.title}>
                <h3 className="text-base font-semibold text-primary">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{pillar.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
