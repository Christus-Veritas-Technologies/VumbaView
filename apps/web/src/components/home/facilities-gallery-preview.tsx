import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { placeholderPhoto } from "@/lib/images";
import Image from "next/image";

const gallery = [
  {
    image: { src: placeholderPhoto("gallery-classrooms"), alt: "Modern classroom interior" },
    label: "Modern Classrooms",
  },
  {
    image: { src: placeholderPhoto("gallery-library"), alt: "School library reading area" },
    label: "Resource Library",
  },
  {
    image: { src: placeholderPhoto("gallery-sport"), alt: "Students playing sport outdoors" },
    label: "Sport & Recreation",
  },
  {
    image: { src: placeholderPhoto("gallery-study"), alt: "Student focused on schoolwork" },
    label: "Focused Learning",
  },
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
            description="An 18-hectare campus on the road toward the Bvumba Mountains, with science and computer labs, a full library, and sports fields for every season."
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
