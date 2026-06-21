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
      // Brand palette: gold is primary (buttons, active tab, highlights).
      // success/danger/warning are semantic status colors (paid/overdue/
      // pending) used via Badge/ErrorState/etc rather than raw slate/emerald
      // literals, so every screen pulls from the same named scale.
      extend: {
        colors: {
          gold: {
            50: "#FBF7EC",
            100: "#F5EBCF",
            200: "#EAD89D",
            300: "#DFC169",
            400: "#D2A93F",
            500: "#C19426",
            600: "#A37A1D",
            700: "#80601A",
            800: "#624B1A",
            900: "#503E19",
          },
          success: {
            50: "#ECFDF5",
            100: "#D1FAE5",
            200: "#A7F3D0",
            300: "#6EE7B7",
            400: "#34D399",
            500: "#10B981",
            600: "#059669",
            700: "#047857",
            800: "#065F46",
            900: "#064E3B",
          },
          danger: {
            50: "#FEF2F2",
            100: "#FEE2E2",
            200: "#FECACA",
            300: "#FCA5A5",
            400: "#F87171",
            500: "#EF4444",
            600: "#DC2626",
            700: "#B91C1C",
            800: "#991B1B",
            900: "#7F1D1D",
          },
          warning: {
            50: "#FFF7ED",
            100: "#FFEDD5",
            200: "#FED7AA",
            300: "#FDBA74",
            400: "#FB923C",
            500: "#F97316",
            600: "#EA580C",
            700: "#C2410C",
            800: "#9A3412",
            900: "#7C2D12",
          },
          // Purely decorative accents (icon badges, stat cards, background
          // shapes) — not status colors, so they're separate from
          // success/danger/warning above. Gives the dashboard/list screens
          // the same multi-color icon-badge variety as the reference
          // designs instead of everything reading in shades of gold.
          info: {
            50: "#EFF6FF",
            100: "#DBEAFE",
            200: "#BFDBFE",
            300: "#93C5FD",
            400: "#60A5FA",
            500: "#3B82F6",
            600: "#2563EB",
            700: "#1D4ED8",
          },
          violet: {
            50: "#F5F3FF",
            100: "#EDE9FE",
            200: "#DDD6FE",
            300: "#C4B5FD",
            400: "#A78BFA",
            500: "#8B5CF6",
            600: "#7C3AED",
            700: "#6D28D9",
          },
        },
        fontFamily: {
          heading: ["PlusJakartaSans_700Bold"],
          "heading-semibold": ["PlusJakartaSans_600SemiBold"],
          "heading-extrabold": ["PlusJakartaSans_800ExtraBold"],
          body: ["Inter_400Regular"],
          "body-medium": ["Inter_500Medium"],
          "body-semibold": ["Inter_600SemiBold"],
          "body-bold": ["Inter_700Bold"],
        },
      },
    },
    plugins: [],
  }
