import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved connection config + seed wiring out of schema.prisma and
// package.json#prisma into this file. Always invoke Prisma through the
// project's pinned local binary — e.g. `pnpm db:migrate`, `pnpm exec prisma
// migrate dev`, or `pnpm prisma migrate dev` — never `pnpm dlx prisma ...`,
// which ignores this pin and fetches whatever CLI version is latest on the
// registry instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun run prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
