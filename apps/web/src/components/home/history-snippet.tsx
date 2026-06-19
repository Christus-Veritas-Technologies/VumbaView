import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { schoolFacts, siteConfig } from "@/lib/site-config";
import { images } from "@/lib/images";
import Image from "next/image";

export function HistorySnippet() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
          <Image
            src={images.mountainRise.src}
            alt={images.mountainRise.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <SectionHeading
          eyebrow="Our History"
          title={`Since ${schoolFacts.founded},`}
          accent="for Manicaland's future"
          description={`${siteConfig.name} was founded in ${schoolFacts.founded} by a small group of Manicaland educators who believed Mutare's children deserved a school as ambitious as the mountains above it. What began as three classrooms on a tea-and-coffee smallholding has grown into a full ECD-to-A-Level campus of ${schoolFacts.enrollment} students, without losing the close-knit, every-child-known character our founders intended.`}
        />
      </Container>
    </section>
  );
}
