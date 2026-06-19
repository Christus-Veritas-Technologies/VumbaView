import { Container } from "@/components/marketing/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@vva/ui/components/button";
import Link from "next/link";

export function ClosingCta() {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-16 text-center text-primary-foreground sm:px-16">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to see VumbaView for yourself?
          </h2>
          <p className="max-w-lg text-base text-primary-foreground/85 sm:text-lg">
            Book a campus tour, meet our teachers, and find out if VumbaView Academy is the
            right fit for your child.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              render={<Link href="/admissions" />}
              className="h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
            >
              Start an Application
            </Button>
            <Button
              render={<Link href="/contact" />}
              variant="outline"
              className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20"
            >
              Contact Admissions
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
