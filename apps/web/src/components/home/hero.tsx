import { Eyebrow } from "@/components/marketing/eyebrow";
import { schoolFacts, siteConfig } from "@/lib/site-config";
import { images } from "@/lib/images";
import { Button } from "@vva/ui/components/button";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src={images.heroMountains.src}
        alt={images.heroMountains.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
        <Eyebrow className="bg-white/15 text-white">Mutare, Zimbabwe</Eyebrow>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {siteConfig.name}: <span className="text-accent">{siteConfig.motto}</span>
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          An ECD-to-A-Level day school set on the slopes above Mutare, overlooking the misty
          Bvumba Mountains — where {schoolFacts.enrollment} learners grow into confident,
          capable young people.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            render={<Link href="/admissions" />}
            className="h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90"
          >
            Begin Your Application
          </Button>
          <Button
            render={<Link href="/about" />}
            variant="outline"
            className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20"
          >
            Discover Our Story
          </Button>
        </div>

        <dl className="mt-8 grid max-w-xl grid-cols-3 gap-6 border-t border-white/20 pt-6">
          <div>
            <dt className="text-xs tracking-wide text-white/70 uppercase">Founded</dt>
            <dd className="text-2xl font-bold text-white">{schoolFacts.founded}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-white/70 uppercase">Students</dt>
            <dd className="text-2xl font-bold text-white">{schoolFacts.enrollment}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wide text-white/70 uppercase">Staff Ratio</dt>
            <dd className="text-2xl font-bold text-white">{schoolFacts.staffToStudentRatio}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
