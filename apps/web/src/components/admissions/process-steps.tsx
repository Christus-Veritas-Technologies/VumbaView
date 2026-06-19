import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { FileText, MessagesSquare, Search, UserCheck } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "1. Submit Your Inquiry",
    body: "Complete the admissions inquiry form below with your child's details and the level you're applying for.",
  },
  {
    icon: MessagesSquare,
    title: "2. Admissions Call",
    body: "Our admissions team contacts you within 3 working days to discuss your child's needs and answer questions.",
  },
  {
    icon: Search,
    title: "3. Assessment & Tour",
    body: "Your child sits a short placement assessment and your family is invited for a guided campus tour.",
  },
  {
    icon: UserCheck,
    title: "4. Offer & Enrollment",
    body: "Successful applicants receive an offer letter and enrollment pack, with a deposit to confirm the place.",
  },
] as const;

export function ProcessSteps() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="How It Works"
            title="Four steps to"
            accent="joining VumbaView"
          />
        </Reveal>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <StaggerItem
              key={step.title}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
