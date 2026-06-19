"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * `next/link` wrapped with Framer Motion so card-style links can get subtle
 * hover/tap feedback. Usage mirrors `next/link` (href, children, className).
 */
export const MotionLink = motion(Link);
