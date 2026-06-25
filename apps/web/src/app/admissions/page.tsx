import { FaqSection } from "@/components/admissions/faq-section";
import { InquiryForm } from "@/components/admissions/inquiry-form";
import { ProcessSteps } from "@/components/admissions/process-steps";
import { RequirementsDates } from "@/components/admissions/requirements-dates";
import { PageHero } from "@/components/marketing/page-hero";
import { images } from "@/lib/images";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admissions",
  description: "How to apply to VumbaView Academy in Mutare, Zimbabwe — process, requirements, and key dates.",
};

export default function AdmissionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Admissions"
        title="Join the VumbaView community"
        description="We welcome applications from families across Mutare and Manicaland for Form 1 through Form 6."
        image={images.graduationGroup}
      />
      <ProcessSteps />
      <RequirementsDates />
      <InquiryForm />
      <FaqSection />
    </>
  );
}
