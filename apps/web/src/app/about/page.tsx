import { HeadWelcome } from "@/components/about/head-welcome";
import { HistoryStory } from "@/components/about/history-story";
import { LeadershipHighlight } from "@/components/about/leadership-highlight";
import { MissionVisionValues } from "@/components/about/mission-vision-values";
import { PageCta } from "@/components/marketing/page-cta";
import { PageHero } from "@/components/marketing/page-hero";
import { studentPhotos } from "@/lib/images";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "The history, mission, and people behind VumbaView Academy in Mutare, Zimbabwe.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About VumbaView"
        title="A Mutare school built on discipline and results"
        description="Founded in 2022, VumbaView Academy has grown quickly into a full ECD-to-A-Level community — without losing sight of why it was founded: results, discipline, and a teacher who knows every learner's name."
        image={studentPhotos[2]!}
      />
      <HistoryStory />
      <MissionVisionValues />
      <HeadWelcome />
      <LeadershipHighlight />
      <PageCta
        title="Come see VumbaView in person"
        description="The best way to understand our school is to visit it. Book a tour or start your child's application today."
        primaryLabel="Start an Application"
        secondaryLabel="Book a Tour"
      />
    </>
  );
}
