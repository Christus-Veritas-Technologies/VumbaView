"use client";

import { Toaster } from "@vva/ui/components/sonner";
import { MotionConfig } from "framer-motion";

import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      // next-themes injects a <script> for pre-hydration theme detection;
      // React 19 logs a false-positive "script tag" warning for it unless
      // it's typed as non-executable. Known issue:
      // https://github.com/pacocoursey/next-themes/issues/387
      scriptProps={{ type: "application/json" }}
    >
      <MotionConfig reducedMotion="user">
        {children}
        <Toaster richColors />
      </MotionConfig>
    </ThemeProvider>
  );
}
