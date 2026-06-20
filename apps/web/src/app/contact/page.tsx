import { ContactForm } from "@/components/contact/contact-form";
import { ContactInfoCards } from "@/components/contact/contact-info-cards";
import { LocationMap } from "@/components/contact/location-map";
import { PageHero } from "@/components/marketing/page-hero";
import { images } from "@/lib/images";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with VumbaView Academy in Mutare, Zimbabwe.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Whether you're a prospective family or a current parent, our team is here to help."
        image={images.mountainValley}
      />
      <ContactInfoCards />
      <LocationMap />
      <ContactForm />
    </>
  );
}
