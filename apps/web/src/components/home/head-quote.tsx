import { Container } from "@/components/marketing/container";
import { Reveal } from "@/components/motion/reveal";
import { schoolFacts } from "@/lib/site-config";
import { images } from "@/lib/images";
import { Quote } from "lucide-react";
import Image from "next/image";

export function HeadQuote() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="grid items-center gap-10 rounded-3xl bg-primary px-8 py-12 text-primary-foreground sm:px-12 lg:grid-cols-[auto_1fr] lg:gap-16">
          <div className="relative mx-auto size-32 shrink-0 overflow-hidden rounded-full ring-4 ring-white/20 sm:size-40">
            <Image
              src={images.teacherLecturing.src}
              alt={`${schoolFacts.headOfSchool.name}, ${schoolFacts.headOfSchool.title}`}
              fill
              sizes="160px"
              className="object-cover"
            />
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
