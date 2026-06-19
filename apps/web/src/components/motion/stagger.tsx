"use client";

import { motion, type Variants } from "framer-motion";
import * as React from "react";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Wraps a grid/list of children so they reveal with a staggered cascade the
 * first time the group scrolls into view. Pair with `StaggerItem` on each
 * direct child.
 */
export function StaggerGroup({ children, ...props }: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={containerVariants}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: React.ComponentProps<typeof motion.div>) {
  return (
    <motion.div variants={itemVariants} {...props}>
      {children}
    </motion.div>
  );
}
