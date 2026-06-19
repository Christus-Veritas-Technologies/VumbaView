import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { images } from "@/lib/images";
import Image from "next/image";

const activities = [
  { image: images.soccerKidsOne, label: "Football & Netball" },
  { image: images.soccerKidsTwo, label: "Athletics" },
  { image: images.libraryCircular, label: "Debate & Quiz Club" },
  { image: images.graduationGroup, label: "Music & Choir" },
] as const;

export function Extracurriculars() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Beyond the Classroom"
            title="Activities that build"
            accent="teamwork & confidence"
          />
        </Reveal>
        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {activities.map((activity) => (
            <StaggerItem
              key={activity.label}
              className="group relative aspect-square overflow-hidden rounded-3xl"
            >
              <Image
                src={activity.image.src}
                alt={activity.image.alt}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-4 text-sm font-semibold text-white">
                {activity.label}
              </span>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
