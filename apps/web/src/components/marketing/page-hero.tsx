"use client";

import { Eyebrow } from "@/components/marketing/eyebrow";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: { src: string; alt: string };
};

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export function PageHero({ eyebrow, title, description, image }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <Image src={image.src} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/60 to-primary/30" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={container}
        className="relative mx-auto flex max-w-6xl flex-col gap-5 px-4 py-24 sm:px-6 sm:py-32 lg:px-8"
      >
        <motion.div variants={item}>
          <Eyebrow className="bg-white/15 text-white">{eyebrow}</Eyebrow>
        </motion.div>
        <motion.h1
          variants={item}
          className="max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl"
        >
          {title}
        </motion.h1>
        <motion.p variants={item} className="max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          {description}
        </motion.p>
      </motion.div>
    </section>
  );
}
