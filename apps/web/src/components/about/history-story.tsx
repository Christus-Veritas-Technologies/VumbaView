import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { schoolFacts, siteConfig } from "@/lib/site-config";
import { images } from "@/lib/images";
import Image from "next/image";

export function HistoryStory() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <SectionHeading
          eyebrow="Our Story"
          title="Three classrooms,"
          accent="one mountain view"
          description={`${siteConfig.name} opened its doors in ${schoolFacts.founded} on a smallholding along the Christmas Pass road, founded by a group of Manicaland teachers who had taught across Mutare's government schools and wanted to build something smaller and more deliberate. They started with three classrooms, a borrowed set of textbooks, and forty pupils.`}
        />
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src={images.mountainLandscape.src}
              alt={images.mountainLandscape.alt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Four decades on, the campus has grown to {schoolFacts.campusSize} and{" "}
            {schoolFacts.enrollment} students across ECD, Primary, and Secondary, but the
            founders&apos; original promise still holds: a teacher who knows your child&apos;s
            name, and a curriculum that prepares them for ZIMSEC and beyond.
          </p>
        </div>
      </Container>
    </section>
  );
}
