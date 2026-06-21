import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved connection config + seed wiring out of schema.prisma and
// package.json#prisma into this file. Always invoke Prisma through the
// project's pinned local binary — e.g. `pnpm db:migrate`, `pnpm exec prisma
// migrate dev`, or `pnpm prisma migrate dev` — never `pnpm dlx prisma ...`,
// which ignores this pin and fetches whatever CLI version is latest on the
// registry instead.
//
// Prisma Postgres issues two connection strings that share credentials but
// differ in host: `pooled.db.prisma.io` for application traffic (used by
// src/db.ts's PrismaPg adapter via DATABASE_URL) and `db.prisma.io` for
// migrations/introspection/Studio (DIRECT_URL, used here). Pointing the CLI
// at the pooled host instead is the documented cause of migration failures —
// the pooler doesn't preserve the session state `migrate` needs.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
