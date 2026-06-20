import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { MotionLink } from "@/components/motion/motion-link";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { placeholderPhoto } from "@/lib/images";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@vva/ui/components/button";
import Image from "next/image";
import Link from "next/link";

const quickLinks = [
  {
    href: "/about",
    label: "About Us",
    image: { src: placeholderPhoto("welcome-about"), alt: "VumbaView Academy campus" },
    caption: `Our story since ${siteConfig.founded}`,
  },
  {
    href: "/academics",
    label: "Academics",
    image: { src: placeholderPhoto("welcome-academics"), alt: "Teacher leading a classroom lesson" },
    caption: "ECD to A-Level",
  },
  {
    href: "/academics",
    label: "Facilities",
    image: { src: placeholderPhoto("welcome-facilities"), alt: "School library and resource center" },
    caption: "Labs, library & sport",
  },
  {
    href: "/admissions",
    label: "Admissions",
    image: { src: placeholderPhoto("welcome-admissions"), alt: "Graduates celebrating at commencement" },
    caption: "Join our community",
  },
] as const;

export function WelcomeIntro() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Welcome"
            title="Discover life at"
            accent="VumbaView Academy"
            description="From our first ECD classroom to our A-Level science labs, every learner at VumbaView is known by name and pushed toward their best work."
          />
          <Button
            render={<Link href="/about" />}
            variant="outline"
            className="h-11 shrink-0 rounded-full px-6"
          >
            Learn More
          </Button>
        </Reveal>

        <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((item) => (
            <StaggerItem key={item.label}>
              <MotionLink
                href={item.href}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="group relative block aspect-[3/4] overflow-hidden rounded-3xl"
              >
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0.5 p-4">
                  <span className="text-lg font-bold text-white">{item.label}</span>
                  <span className="text-xs text-white/80">{item.caption}</span>
                </div>
              </MotionLink>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
