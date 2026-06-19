import { Container } from "@/components/marketing/container";
import { SectionHeading } from "@/components/marketing/section-heading";
import { contactInfo } from "@/lib/site-config";

export function LocationMap() {
  return (
    <section className="bg-secondary/40 py-20 sm:py-28">
      <Container className="flex flex-col gap-10">
        <SectionHeading
          align="center"
          eyebrow="Find Us"
          title="On the road toward"
          accent="the Bvumba Mountains"
        />
        <div className="overflow-hidden rounded-3xl border border-border">
          <iframe
            src={contactInfo.mapEmbedSrc}
            title="Map showing VumbaView Academy location in Mutare"
            className="h-96 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </Container>
    </section>
  );
}
