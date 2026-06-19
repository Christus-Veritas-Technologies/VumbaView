"use client";

import { motion, type Variants } from "framer-motion";
import * as React from "react";

type RevealProps = React.ComponentProps<typeof motion.div> & {
  /** Additional delay, in seconds, before the reveal starts. */
  delay?: number;
  /** Distance, in pixels, the element travels as it fades in. */
  y?: number;
};

/**
 * Fades + slides content into view the first time it crosses into the
 * viewport. Intended for scroll-triggered entry animation on section-level
 * blocks (headings, copy, images, cards).
 */
export function Reveal({ delay = 0, y = 24, transition, children, ...props }: RevealProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1], ...transition }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
