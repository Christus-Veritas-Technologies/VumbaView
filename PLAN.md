# VumbaView Academy — Website Build Plan

Marketing/informational site for a fictional private school in Mutare, Zimbabwe, built inside `apps/web` (Next.js App Router + Tailwind v4 + `@vva/ui`).

## Design system — "Teal Modern"

Inspired by the SMA Dr. Soetomo reference (extracted as reusable principles, not copied 1:1):

- **Typography**: bold, tight-tracking sans headlines (Geist Sans); small uppercase "eyebrow" labels with a colored dot before every section heading; two-tone headlines where the closing phrase is set in the accent color.
- **Layout**: generous section padding (`py-20`–`py-28`), alternating image/text two-column rows, 4-up rounded photo grids with caption overlays, centered max-width containers.
- **Shape**: soft rounded corners (`rounded-2xl`/`3xl`) on cards and images, fully pill-shaped (`rounded-full`) buttons and badges.
- **Color**: deep teal primary (brand + buttons + nav), warm gold/amber accent (highlights, eyebrow dots, two-tone headline phrase), off-white background with light teal-tinted alternate sections.
- **Motif**: the Bvumba ("Mountains of the Mist") setting — misty mountain photography used for hero/banner backdrops, school motto "Through the Mist, Into the Light".

## Fictional school facts (placeholder, plausible)

- **Name**: VumbaView Academy · **Founded**: 1987 · **Motto**: "Through the Mist, Into the Light"
- **Location**: 14 Vumba Road, Mutare, Manicaland, Zimbabwe — on the Christmas Pass road toward the Bvumba Mountains
- **Levels**: ECD A/B → Grade 1–7 (Primary) → Form 1–4 (O-Level) → Form 5–6 (A-Level), ZIMSEC curriculum
- **Enrollment**: ~650 students · staff:student ratio 1:14
- **Head of School**: Mrs. Tendai Chikwava
- **Contact**: +263 20 123 4567 · info@vumbaview.ac.zw · Mon–Fri 7:30–16:00

## Images

Sourced from Unsplash (hotlinked via `images.unsplash.com`, permitted under the Unsplash License), credited in `src/lib/images.ts`. Themes: misty Bvumba mountains, classrooms, library, graduation, school sports.

## Feature → Task → Todo

Each Todo = exactly one git commit.

### Feature 1 — Foundation & Design System
- [x] Write project plan (this document)
- [x] Apply teal & gold theme tokens to `@vva/ui` globals.css
- [x] Allow Unsplash remote images in `next.config.ts`
- [x] Add site configuration constants (nav, contact info, school facts)
- [x] Add sourced image manifest (`src/lib/images.ts`)
- [x] Add shared marketing UI primitives (Eyebrow, SectionHeading, Container)
- [x] Build SiteHeader (nav + Apply Now CTA)
- [x] Build SiteFooter
- [x] Wire header/footer into root layout + update metadata

### Feature 2 — Home Page
- [x] Build hero section
- [x] Build welcome intro + quick-links grid
- [x] Build founding history snippet section
- [x] Build mission & vision teaser section
- [x] Build Head of School quote section
- [x] Build academic pathways preview section
- [x] Build facilities/activities gallery preview section
- [x] Build closing admissions CTA band
- [x] Assemble Home page (`src/app/page.tsx`)

### Feature 3 — About Page
- [x] Build About hero banner (+ shared `PageHero` primitive)
- [x] Build full history & story section
- [x] Build mission / vision / values section
- [x] Build Head of School welcome message section
- [x] Build leadership team highlight section
- [x] Build About closing CTA (+ shared `PageCta` primitive)
- [x] Assemble About page (`src/app/about/page.tsx`)

### Feature 4 — Academics Page
- [x] Build curriculum pathway cards (ECD → A-Level)
- [x] Build curriculum pillars section
- [x] Build facilities & labs grid
- [x] Build extracurricular activities section
- [x] Assemble Academics page (`src/app/academics/page.tsx`)

### Feature 5 — Admissions Page
- [x] Build admissions process steps section
- [x] Build requirements & key dates section
- [x] Add `Textarea` primitive to `@vva/ui` (needed for forms)
- [x] Build admissions inquiry form (validated, toast confirmation)
- [x] Build admissions FAQ section
- [x] Assemble Admissions page (`src/app/admissions/page.tsx`)
- [x] Mount `Toaster` in root layout

### Feature 6 — Contact Page
- [x] Build contact info cards section
- [x] Build location/map section
- [x] Build contact form (validated, toast confirmation)
- [x] Assemble Contact page (`src/app/contact/page.tsx`)

### Feature 7 — Final Polish & QA
- [x] Verify navigation consistency across all pages
- [x] Responsive & accessibility pass (alt text, contrast, mobile menu, focus states)
- [ ] Typecheck/build verification — **blocked**: sandbox shell unavailable all session and `node_modules` was never installed in this checkout, so `pnpm check-types`/`pnpm build` could not be run. Code was reviewed by hand for the known failure patterns (Base UI `render` prop vs. `asChild`, import ordering, route-typing). Run `pnpm install && pnpm check-types && pnpm build` before deploying.
- [x] Add placeholder-content note for future replacement (see below)

## Placeholder content note

All copy (school history, staff names, quotes, fees, dates, phone/email) is fictional, written to be plausible for a Mutare, Zimbabwe private school — **not real information**. Replace before any real-world use: `src/lib/site-config.ts` (facts, contact info), every section component under `src/components/{home,about,academics,admissions,contact}/` (body copy), and `src/lib/images.ts` (stock photography, swap for real campus photos when available).
