import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";

const faqs = [
  {
    question: "What age does my child need to be to start Form 1?",
    answer:
      "Most learners begin Form 1 at age 13, having completed Grade 7 elsewhere. We also accept direct entry into Form 2 through Form 6, subject to a placement assessment.",
  },
  {
    question: "Do you accept transfer students mid-year?",
    answer:
      "Yes, subject to space and a successful placement assessment. Contact our admissions team directly to check availability for the current term.",
  },
  {
    question: "Is boarding available?",
    answer:
      "VumbaView Academy is a day school. We do not currently offer boarding, though we can recommend trusted transport providers serving the wider Mutare area.",
  },
  {
    question: "What language is instruction given in?",
    answer:
      "English is the medium of instruction throughout, in line with the ZIMSEC curriculum. Shona and Ndebele are offered as examinable subjects.",
  },
] as const;

export function FaqSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <Reveal>
          <SectionHeading align="center" eyebrow="FAQ" title="Common" accent="admissions questions" />
        </Reveal>
        <StaggerGroup className="mx-auto flex max-w-3xl flex-col divide-y divide-border">
          {faqs.map((faq) => (
            <StaggerItem key={faq.question} className="flex flex-col gap-2 py-6">
              <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
