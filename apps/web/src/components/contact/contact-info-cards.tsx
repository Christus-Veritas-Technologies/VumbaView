import { Container } from "@/components/marketing/container";
import { StaggerGroup, StaggerItem } from "@/components/motion/stagger";
import { contactInfo } from "@/lib/site-config";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export function ContactInfoCards() {
  const cards = [
    {
      icon: MapPin,
      title: "Visit Us",
      lines: contactInfo.addressLines,
    },
    {
      icon: Phone,
      title: "Call Us",
      lines: [contactInfo.phone, contactInfo.mobile],
    },
    {
      icon: Mail,
      title: "Email Us",
      lines: [contactInfo.email, contactInfo.admissionsEmail],
    },
    {
      icon: Clock,
      title: "Office Hours",
      lines: [contactInfo.officeHours],
    },
  ] as const;

  return (
    <section className="py-20 sm:py-28">
      <Container>
        <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <StaggerItem
              key={card.title}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-6"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <card.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
              <div className="flex flex-col text-sm text-muted-foreground">
                {card.lines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </div>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Container>
    </section>
  );
}
