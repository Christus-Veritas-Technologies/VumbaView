# vva

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack). It now contains three apps:

- **`apps/web`** — Next.js marketing site (TailwindCSS, shared `packages/ui` shadcn/ui primitives). See `PLAN.md` for page-by-page scope.
- **`apps/server`** — Hono API (Prisma + PostgreSQL) backing the Reception System below.
- **`apps/reception`** — Expo app for front-desk student/fee management (Receptionist + Admin roles), offline-first. See `RECEPTION_PLAN.md` for feature scope.

## Getting started

```bash
pnpm install
```

```bash
pnpm run dev          # all apps
pnpm run dev:web      # apps/web only
pnpm run check-types  # typecheck across all apps
```

`apps/web` runs at [http://localhost:3001](http://localhost:3001).

### `apps/server` setup

Copy `apps/server/.env.example` to `apps/server/.env` and fill in:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string (self-hosted; no docker-compose is provided). |
| `JWT_SECRET` | Random secret used to sign staff session tokens. |
| `CORS_ORIGIN` | Origin allowed to call the API — defaults to `apps/web`'s dev server (`http://localhost:3001`). The Expo reception app is native-only and isn't subject to browser CORS. |
| `PORT` | Port the API listens on. Defaults to `3000`. |
| `NODE_ENV` | `development` or `production`. |

```bash
cd apps/server
pnpm db:generate   # prisma generate
pnpm db:migrate     # prisma migrate dev
pnpm db:seed        # fictional students + demo admin/receptionist accounts
pnpm dev
```

### `apps/reception` setup

Set `EXPO_PUBLIC_API_URL` (e.g. in `apps/reception/.env` or your shell) to the server's URL — defaults to `http://localhost:3000` if unset. The app is offline-first: students and payments queue locally (`expo-sqlite`) and sync automatically once the server is reachable.

```bash
cd apps/reception
npx expo install   # ensures native module versions match the installed Expo SDK
npx expo prebuild   # regenerates ios/android — required after adding the Bluetooth printer native module
npm run start         # expo start --dev-client (a custom dev client is required — Expo Go doesn't have the Bluetooth printer native module)
```

Bluetooth receipt printing (`/receipt/[id]`) is Android-only — third-party iOS apps can't reach classic-Bluetooth SPP printers without MFi certification, so the app surfaces a clear error on iOS instead of silently failing.

### `apps/web`

Copy `apps/web/.env.example` to `apps/web/.env` and set:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of `apps/server`'s API — used by the admissions inquiry form (page + navbar dialog) to submit directly from the browser. Defaults to `http://localhost:3000`. |

```bash
cd apps/web
pnpm dev
```

## Verifying a checkout before deploying

```bash
pnpm install
pnpm -F server exec tsc --noEmit
pnpm -F reception exec tsc --noEmit
pnpm -F web build
```

## UI customization (`apps/web`)

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

Add more shared components from the project root:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@vva/ui/components/button";
```

If you want app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Project structure

```
vva/
├── apps/
│   ├── web/         # Marketing site (Next.js)
│   ├── server/      # Reception API (Hono + Prisma)
│   └── reception/   # Reception app (Expo)
├── packages/
│   └── ui/          # Shared shadcn/ui components and styles
```
