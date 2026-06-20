import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@vva/env/server";

declare global {
  // eslint-disable-next-line no-var
  var prismaClient: PrismaClient | undefined;
}

// Prisma 7 requires an explicit driver adapter for every database — there's
// no more implicit datasource.url wiring from schema.prisma. Wrapped in a
// factory so a hot-reload that finds an existing cached client doesn't also
// spin up a throwaway adapter/pool it never uses.
function createClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse a single client across Bun's --hot reloads in dev so we don't leak
// Postgres connections every time a file changes.
export const prisma = globalThis.prismaClient ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaClient = prisma;
}
