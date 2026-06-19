"use client";

import { Toaster } from "@vva/ui/components/sonner";
import { MotionConfig } from "framer-motion";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster richColors />
      </MotionConfig>
    </ThemeProvider>
  );
}
