import { Container } from "@/components/marketing/container";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { schoolFacts } from "@/lib/site-config";
import { images } from "@/lib/images";
import Image from "next/image";

export function HeadWelcome() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="grid items-center gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl">
          <Image
            src={images.teacherLecturing.src}
            alt={`${schoolFacts.headOfSchool.name} with students at VumbaView Academy`}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col gap-4">
          <Eyebrow>A Note From Our Head</Eyebrow>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            &ldquo;When parents visit VumbaView for the first time, I tell them the same
            thing I tell our staff every term: this school exists so that a child from
            Mutare can compete with anyone, anywhere, without losing who they are. We
            ground our students in ZIMSEC&apos;s rigor, but we never let a class get so
            large that a teacher stops noticing when a student is struggling — or
            thriving.&rdquo;
          </p>
          <p className="text-lg leading-relaxed text-foreground sm:text-xl">
            &ldquo;I invite you to walk our halls, sit in on a lesson, and meet the
            teachers who will know your child&apos;s name by their second week here.&rdquo;
          </p>
          <div className="mt-2">
            <p className="font-semibold text-foreground">{schoolFacts.headOfSchool.name}</p>
            <p className="text-sm text-muted-foreground">{schoolFacts.headOfSchool.title}, VumbaView Academy</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
