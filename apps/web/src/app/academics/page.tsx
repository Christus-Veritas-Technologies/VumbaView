import { CurriculumPillars } from "@/components/academics/curriculum-pillars";
import { Extracurriculars } from "@/components/academics/extracurriculars";
import { FacilitiesLabsGrid } from "@/components/academics/facilities-labs-grid";
import { PathwayCards } from "@/components/academics/pathway-cards";
import { PageCta } from "@/components/marketing/page-cta";
import { PageHero } from "@/components/marketing/page-hero";
import { studentPhotos } from "@/lib/images";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Academics",
  description: "ZIMSEC-aligned academics from Form 1 to Form 6 at VumbaView Academy, Mutare.",
};

export default function AcademicsPage() {
  return (
    <>
      <PageHero
        eyebrow="Academics"
        title="A ZIMSEC curriculum built around results"
        description="From Form 1 orientation through A-Level specialisation, our curriculum is designed to be rigorous, well-resourced, and personal."
        image={studentPhotos[1]!}
      />
      <PathwayCards />
      <CurriculumPillars />
      <FacilitiesLabsGrid />
      <Extracurriculars />
      <PageCta
        title="See our classrooms for yourself"
        description="Schedule a campus visit to meet our teachers and sit in on a lesson."
        primaryLabel="Apply Now"
        secondaryLabel="Book a Tour"
      />
    </>
  );
}
