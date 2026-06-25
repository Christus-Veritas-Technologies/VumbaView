import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { schoolFacts, siteConfig } from "@/lib/site-config";
import { studentPhotos } from "@/lib/images";
import Image from "next/image";

export function HistoryStory() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <SectionHeading
            eyebrow="Our Story"
            title="Three classrooms,"
            accent="one non-negotiable standard"
            description={`${siteConfig.name} opened its doors in ${schoolFacts.founded} on a smallholding along the Christmas Pass road, founded by a group of Manicaland teachers who had taught across Mutare's government schools and wanted to build something smaller and more deliberate. They started with three classrooms, a borrowed set of textbooks, and forty pupils.`}
          />
        </Reveal>
        <Reveal delay={0.15} className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={studentPhotos[8]!.src} alt={studentPhotos[8]!.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            In just a few short years, the campus has grown to {schoolFacts.campusSize} and{" "}
            {schoolFacts.enrollment} students across Form 1 to Form 6, but the founders&apos;
            original promise still holds: a teacher who knows your child&apos;s name, and a
            curriculum that prepares them for ZIMSEC and beyond.
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
