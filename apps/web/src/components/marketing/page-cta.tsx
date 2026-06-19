import { Container } from "@/components/marketing/container";
import { Reveal } from "@/components/motion/reveal";
import type { NavLink } from "@/lib/site-config";
import { Button } from "@vva/ui/components/button";
import Link from "next/link";

type PageCtaProps = {
  title: string;
  description: string;
  primaryHref: NavLink["href"];
  primaryLabel: string;
  secondaryHref: NavLink["href"];
  secondaryLabel: string;
};

export function PageCta({
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: PageCtaProps) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-16 text-center text-primary-foreground sm:px-16">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="max-w-lg text-base text-primary-foreground/85 sm:text-lg">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              render={<Link href={primaryHref} />}
              className="h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
            >
              {primaryLabel}
            </Button>
            <Button
              render={<Link href={secondaryHref} />}
              variant="outline"
              className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20"
            >
              {secondaryLabel}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
