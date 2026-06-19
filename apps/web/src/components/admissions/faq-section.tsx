import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";

const faqs = [
  {
    question: "What age does my child need to be to start ECD A?",
    answer:
      "Children must be 3 years old by the 1st of January of the intake year to start ECD A. We also accept direct entry into Primary, Lower Secondary, and Upper Secondary, subject to assessment.",
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
      "English is the medium of instruction from Grade 1 onward, in line with the ZIMSEC curriculum. Shona and Ndebele are offered as examinable subjects.",
  },
] as const;

export function FaqSection() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col gap-12">
        <SectionHeading align="center" eyebrow="FAQ" title="Common" accent="admissions questions" />
        <div className="mx-auto flex max-w-3xl flex-col divide-y divide-border">
          {faqs.map((faq) => (
            <div key={faq.question} className="flex flex-col gap-2 py-6">
              <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
