import { AcademicPathwaysPreview } from "@/components/home/academic-pathways-preview";
import { ClosingCta } from "@/components/home/closing-cta";
import { FacilitiesGalleryPreview } from "@/components/home/facilities-gallery-preview";
import { HeadQuote } from "@/components/home/head-quote";
import { Hero } from "@/components/home/hero";
import { HistorySnippet } from "@/components/home/history-snippet";
import { MissionVisionTeaser } from "@/components/home/mission-vision-teaser";
import { WelcomeIntro } from "@/components/home/welcome-intro";

export default function Home() {
  return (
    <>
      <Hero />
      <WelcomeIntro />
      <HistorySnippet />
      <MissionVisionTeaser />
      <HeadQuote />
      <AcademicPathwaysPreview />
      <FacilitiesGalleryPreview />
      <ClosingCta />
    </>
  );
}
