import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@vva/env/server";
import { hashPassword } from "../src/lib/password";
import { ROOT_ADMIN_USERNAME } from "../src/lib/constants";

// Ensures the real production admin account exists. Unlike prisma/seed.ts
// (fictional demo data, meant for an empty/dev database and skipped once any
// staff exist), this is meant to run on every container start in
// production — so it's an idempotent upsert-by-username, not a one-shot
// "only if the table is empty" guard: it creates the account once and is a
// no-op on every restart after that, without touching the password hash of
// an account that already exists.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = ROOT_ADMIN_USERNAME;
const ADMIN_PASSWORD = "VumbaView123";

async function main() {
  const existing = await prisma.staff.findUnique({ where: { username: ADMIN_USERNAME } });

  if (existing) {
    console.log(`Admin account "${ADMIN_USERNAME}" already exists — skipping.`);
    return;
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await prisma.staff.create({
    data: { username: ADMIN_USERNAME, passwordHash, role: "ADMIN" },
  });
  console.log(`Created admin account "${ADMIN_USERNAME}".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
