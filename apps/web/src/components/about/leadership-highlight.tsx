import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { images } from "@/lib/images";
import Image from "next/image";

const leaders = [
  {
    name: "Mrs. Tendai Chikwava",
    title: "Head of School",
    image: images.teacherLecturing,
  },
  {
    name: "Mr. Farai Mutasa",
    title: "Deputy Head — Academics",
    image: images.studentAtDesk,
  },
  {
    name: "Mrs. Ruvimbo Sithole",
    title: "Head of Primary",
    image: images.emptyClassroom,
  },
  {
    name: "Mr. Blessing Nyathi",
    title: "Head of Boarding & Pastoral Care",
    image: images.graduationGroup,
  },
] as const;

export function LeadershipHighlight() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading
          align="center"
          eyebrow="Our Leadership"
          title="The team behind"
          accent="every VumbaView learner"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {leaders.map((leader) => (
            <div key={leader.name} className="flex flex-col items-center gap-3 text-center">
              <div className="relative size-28 overflow-hidden rounded-full">
                <Image
                  src={leader.image.src}
                  alt={leader.name}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{leader.name}</h3>
              <p className="text-xs text-muted-foreground">{leader.title}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
