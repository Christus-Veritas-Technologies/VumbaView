import { InquiryDialog } from "@/components/admissions/inquiry-dialog";
import { TourDialog } from "@/components/admissions/tour-dialog";
import { Container } from "@/components/marketing/container";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@vva/ui/components/button";

type PageCtaProps = {
  title: string;
  description: string;
  /** Primary CTA always opens the inquiry dialog, so just its label is needed. */
  primaryLabel: string;
  /** Secondary CTA always opens the tour dialog, so just its label is needed. */
  secondaryLabel: string;
};

export function PageCta({ title, description, primaryLabel, secondaryLabel }: PageCtaProps) {
  return (
    <section className="py-20 sm:py-28">
      <Container>
        <Reveal className="flex flex-col items-center gap-6 rounded-3xl bg-gradient-to-br from-primary to-primary/80 px-8 py-16 text-center text-primary-foreground sm:px-16">
          <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="max-w-lg text-base text-primary-foreground/85 sm:text-lg">{description}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <InquiryDialog
              trigger={
                <Button className="h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90">
                  {primaryLabel}
                </Button>
              }
            />
            <TourDialog
              trigger={
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20"
                >
                  {secondaryLabel}
                </Button>
              }
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
