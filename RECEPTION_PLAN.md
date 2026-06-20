# VumbaView Reception System — Build Plan

Two new apps in the monorepo, currently bare scaffolds: `apps/server` (Hono API) and `apps/reception` (Expo app). This plan covers building both into a working internal tool for front-desk student/fee management, with role-based access for Receptionist and Admin staff.

## Decisions (from planning Q&A)

**Platform** — `apps/reception` is a native Expo app (iOS/Android) only; no web target needed for this tool.

**Roles** — two staff roles with materially different views:
- **Receptionist**: day-to-day data entry — student directory (add/edit/search), recording payments. No financial dashboard.
- **Admin**: oversight & configuration — staff account management, per-level fee settings, "Start New Term," and a dashboard (enrollment overview, fee collection summary, recent activity feed). Admin does not do day-to-day data entry.

**Data & sync** — PostgreSQL (self-hosted by you; no docker-compose, you'll supply `DATABASE_URL`) via Prisma, behind the Hono server. The Expo app is **offline-first**: students/payments can be added with no connection, queued locally, and synced automatically once back online.
- Conflict resolution: **last-write-wins** by timestamp.
- Term-rollover edge case: if a payment is recorded offline and only syncs *after* the server has already started a new term, it's attributed to whichever term is active **at sync time**, not the term the device thought was active when it was created.

**Auth** — individual staff logins (username + password), lightweight custom implementation (hashed passwords, role field, our own session/JWT) — no third-party auth library. Admin creates/manages all staff accounts from inside the app; there's no public signup screen.

**v1 feature scope** — Student directory + Fee/payment tracking only. Attendance and visitor sign-in/out are explicitly out of scope for v1.

**Student record fields** — core identity (name, DOB, optional photo, unique student ID), academic placement (level per the existing ECD/Primary/Form structure, enrollment status, enrollment date), parent/guardian contact (name, phone, email, address). No medical/notes field in v1.

**Fee model**:
- Fee amount is **not hardcoded** — it's configurable in Admin Settings, stored in the database, set **per academic level**, defaulting to $0 until an admin sets it.
- "Start New Term" is a single Admin Settings action: it immediately resets every student's term fee balance, snapshotting the current per-level fee amounts into the new term (so changing fees later doesn't rewrite history).
- Payments are logged as transactions: category (**fees** / **uniforms** / **custom**), amount, date, student, recording staff member.
- Only **fees** payments subtract from a student's term balance. Uniforms/custom payments are logged for record-keeping only — no balance tracked against them.
- Currency: **USD**.

**Admin dashboard** — enrollment overview (counts by level), fee collection summary (collected vs. outstanding), recent activity feed (latest student/payment changes, attributed to staff).

**Seed data** — populate with realistic fictional demo data on first run: students across all levels consistent with the marketing site's lore (~200+, ECD→Form 6), plus one demo admin and one demo receptionist login, so the app is explorable immediately.

**Visual design** — plain/functional UI. Not porting the marketing site's teal/gold branding; this is an internal tool, function over polish. Component library: **React Native Reusables** (shadcn-style, NativeWind-based — already aligned with the template's NativeWind setup). Animation library: **Moti**.

## Implementation calls I'm making without a separate question

Small enough not to warrant another round of questions, flagging them here so you can redirect me if any are wrong:
- **Local/offline store**: `expo-sqlite` on-device, with a simple outbox/queue table for pending writes — the lightest way to get real offline-first behavior without a heavyweight sync framework.
- **Session mechanism**: JWT issued by the server, stored in `expo-secure-store`, sent as a bearer token (mobile clients can't use browser cookies the way a web app would).
- **Fee status display**: a per-student term balance (USD amount owed) plus a derived label (Paid / Partial / Unpaid) computed from balance vs. the level's fee amount — no separate "Overdue"/due-date concept, since none was requested.
- **Term records**: each "Start New Term" creates a new Term row storing its start time and a snapshot of that term's per-level fee amounts, so past terms remain accurate in reporting even after fee amounts change later.

## Feature → Task → Todo

Each Todo = one commit, same convention as the marketing site's `PLAN.md`.

### Feature 1 — Server Foundation
- [x] Add Prisma + PostgreSQL to `apps/server` (`schema.prisma`, `DATABASE_URL` env wiring via `@vva/env`)
- [x] Define core schema: `Staff`, `Student`, `Term`, `LevelFeeAmount` (split into `LevelFeeSetting` + `TermLevelFee` — live config vs. frozen per-term snapshot), `Payment`
- [x] Hono app structure: routers, error-handling middleware, health check route
- [x] Auth endpoints: login (issues JWT), `/me` session check
- [x] Role-gating middleware (admin-only vs. any-staff routes)

### Feature 2 — Server: Student, Staff & Payment APIs
- [x] Student CRUD endpoints (create/list/get/update) — receptionist + admin
- [x] Staff management endpoints (create/list/deactivate) — admin only
- [x] Admin settings endpoints: get/set per-level fee amounts, "start new term"
- [x] Payment endpoint: record a payment, resolving "current term" server-side (handles the offline-rollover edge case)
- [x] Dashboard endpoints: enrollment counts by level, fee collection summary, recent activity feed

### Feature 3 — Server: Seed Data
- [x] Seed script: fictional students across all levels, demo admin + receptionist accounts, initial term at $0 fees

### Feature 4 — Reception App Foundation
- [x] Strip the Expo default template (remove bear-counter demo screens/store)
- [x] Navigation: login screen, role-based layouts (Admin vs. Receptionist)
- [x] API client + token storage (`expo-secure-store`) + login flow
- [x] Local offline store (`expo-sqlite`) + sync engine skeleton (outbox queue, sync-on-reconnect)

### Feature 5 — Reception App: Receptionist Views
- [x] Student directory (search/filter) + student detail view
- [x] Add/edit student form
- [x] Record payment flow (category: fees/uniforms/custom, amount, student)
- [x] "Pending sync" indicators on locally-queued, not-yet-synced records

### Feature 6 — Reception App: Admin Views
- [x] Admin dashboard (enrollment overview, fee collection summary, recent activity feed)
- [x] Admin settings: manage staff accounts, edit per-level fee amounts, "Start New Term" (with confirmation)
- [x] Read-only student directory access for Admin

### Feature 7 — Sync & Edge Cases
- [x] Last-write-wins conflict resolution on sync
- [x] Term-rollover-while-offline handling (payment attributed to the term active at sync time)
- [x] Sync retry/backoff for flaky connections

### Feature 8 — Polish & QA
- [x] Typecheck/build verification for both `apps/server` and `apps/reception` — reviewed by hand (consistent types across `lib/storage/db.ts` ↔ `lib/sync.ts` ↔ screens, no stray imports); sandbox shell unavailable to run `tsc` directly. Run `npx tsc --noEmit` in both `apps/server` and `apps/reception` before deploying — commands are included in the commit script.
- [ ] Manual review: role-gating correctness, fee balance math correctness
- [x] Document new env vars and setup steps (see root `README.md`)

### Feature 9 — Responsive Design, Receipts & Printing, Error Handling
- [x] Tablet-responsive layouts: breakpoint hook (`lib/use-breakpoint.ts`) + Tailwind default breakpoints, applied across receptionist, admin, and login screens (grid directories, side-by-side cards, max-width forms)
- [x] Receipt page (`/receipt/[id]`) with Bluetooth 58mm ESC/POS thermal printer support (`lib/printer.ts`), wired up after a payment is recorded
- [x] Reusable `ErrorState`/`LoadingState` components, applied app-wide alongside the responsive and printer work
