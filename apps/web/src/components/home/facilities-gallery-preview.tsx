import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { studentPhotos } from "@/lib/images";
import Image from "next/image";

const gallery = [
  { image: studentPhotos[5]!, label: "Modern Classrooms" },
  { image: studentPhotos[6]!, label: "Resource Library" },
  { image: studentPhotos[4]!, label: "Sport & Recreation" },
  { image: studentPhotos[3]!, label: "Focused Learning" },
] as const;

export function FacilitiesGalleryPreview() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Our Campus"
            title="Built for"
            accent="focus, play & growth"
            description="An 18-hectare campus in Mutare, with science and computer labs, a full library, and sports fields for every season."
          />
        </Reveal>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {gallery.map((item) => (
            <StaggerItem
              key={item.label}
              className="group relative aspect-square overflow-hidden rounded-3xl"
            >
              <Image
                src={item.image.src}
                alt={item.image.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-white">
                {item.label}
              </span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
