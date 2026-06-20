"use client";

import { InquiryDialog } from "@/components/admissions/inquiry-dialog";
import { Eyebrow } from "@/components/marketing/eyebrow";
import { schoolFacts, siteConfig } from "@/lib/site-config";
import { images } from "@/lib/images";
import { Button } from "@vva/ui/components/button";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <Image
        src={images.mountainValley.src}
        alt={images.mountainValley.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-28 sm:px-6 sm:py-36 lg:px-8"
      >
        <motion.div variants={item}>
          <Eyebrow className="bg-white/15 text-white">Mutare, Zimbabwe</Eyebrow>
        </motion.div>
        <motion.h1
          variants={item}
          className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          {siteConfig.name}: <span className="text-accent">{siteConfig.motto}</span>
        </motion.h1>
        <motion.p variants={item} className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          An ECD-to-A-Level day school set on the slopes above Mutare, overlooking the misty
          Bvumba Mountains — where {schoolFacts.enrollment} learners grow into confident,
          capable young people.
        </motion.p>
        <motion.div variants={item} className="flex flex-wrap gap-3">
          <InquiryDialog
            trigger={
              <Button className="h-12 rounded-full bg-accent px-6 text-base text-accent-foreground hover:bg-accent/90">
                Begin Your Application
              </Button>
            }
          />
          <Button
            render={<Link href="/about" />}
            variant="outline"
            className="h-12 rounded-full border-white/40 bg-white/10 px-6 text-base text-white hover:bg-white/20"
          >
            Discover Our Story
          </Button>
        </motion.div>

        <motion.dl
          variants={item}
          className="mt-8 grid max-w-xl grid-cols-3 gap-6 border-t border-white/20 pt-6"
        >
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
        </motion.dl>
      </motion.div>
    </section>
  );
}
