/** @type {import('tailwindcss').Config} */
module.exports = {

      content: ["./app/**/*.{js,ts,tsx}", "./components/**/*.{js,ts,tsx}"],

    presets: [require("nativewind/preset")],
    theme: {
      // Explicit (matches Tailwind's defaults, which `nativewind/preset`
      // already provides) so the breakpoints used in className variants
      // (`md:`, `lg:`) line up with the JS-side `useBreakpoint()` hook in
      // `lib/use-breakpoint.ts` — both read the same 768/1024 cutoffs for
      // tablet-responsive layouts.
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
      extend: {},
    },
    plugins: [],
  }
