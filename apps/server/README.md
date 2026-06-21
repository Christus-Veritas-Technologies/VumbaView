To install dependencies:
```sh
bun install
```

To run:
```sh
bun run dev
```

open http://localhost:3000

## Database (Prisma)

Connection config lives in `prisma.config.ts` (Prisma 7), not in `schema.prisma`. Always run Prisma
through the project's pinned local binary — `pnpm dlx prisma ...` ignores the version pinned in
`package.json` and fetches whatever's latest from the registry, which can pull in breaking changes
this schema isn't written for.

Two env vars are required, both in `.env` locally and as Coolify runtime variables in prod:

- `DATABASE_URL` — used by `src/db.ts`'s PrismaPg adapter for the app's own queries. On Prisma
  Postgres, this is the **pooled** connection string (host `pooled.db.prisma.io`).
- `DIRECT_URL` — used by `prisma.config.ts` for everything the CLI does (migrate, introspect,
  Studio). On Prisma Postgres, this must be the **direct** connection string (host `db.prisma.io`)
  — the pooled host doesn't preserve the session state migrations need, and is also a common cause
  of migrations simply failing to connect. Outside Prisma Postgres (plain local/self-hosted
  Postgres), both vars are the same value.

```sh
pnpm db:generate          # regenerate the Prisma Client
pnpm db:migrate -- --name init   # create + apply a migration (local dev DB only)
pnpm db:seed              # seed demo data — Prisma 7 no longer auto-seeds after migrate
pnpm db:studio            # open Prisma Studio
```

### Generating a migration without a reachable database

`prisma migrate dev` needs to connect to a real Postgres to diff against. If you don't have one
reachable (e.g. the prod DB is only reachable from inside Coolify's internal network), you can
generate the SQL purely from the schema file instead — no connection required:

```sh
pnpm exec prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/<timestamp>_<name>/migration.sql
```

Create the migration folder first (`mkdir`/`New-Item`) — Prisma's own `migrate dev`/`migrate deploy`
just expect a folder named `<14-digit-timestamp>_<name>` containing a `migration.sql`, alongside the
shared `migration_lock.toml`. This only works cleanly for the *first* migration (diffing from an
empty schema); once one migration exists, generate subsequent ones with `--from-migrations
prisma/migrations --to-schema-datamodel prisma/schema.prisma` instead, or just run `db:migrate`
against a reachable dev database.

### Production migrations

`apps/server/Dockerfile`'s `CMD` runs `pnpm db:migrate:deploy` (`prisma migrate deploy`) before
starting the server on every container start. It only applies migration files that aren't yet
recorded as applied — it's a no-op if there's nothing pending — so deploying is enough to roll out
schema changes; there's no need to run migrations against prod from a laptop.

## WhatsApp notifications

`src/lib/whatsapp.ts` runs an automated WhatsApp Web session (via
[whatsapp-web.js](https://wwebjs.dev), driven by a headless Chromium through puppeteer — not the
official WhatsApp Business API) and messages the admin whenever a receptionist records a payment
(`routes/payments.ts`) or a new admissions inquiry/tour request comes in (`routes/admissions.ts`).
Both sends are fire-and-forget: a WhatsApp problem never fails the request that triggered it.

Env vars (both optional — unset means notifications are silently skipped, the rest of the app is
unaffected):

- `ADMIN_WHATSAPP_NUMBER` — the admin's number to notify, e.g. `+263771234567`.
- `CHROMIUM_URL` — overrides which Chromium/Chrome binary puppeteer drives. Leave unset; puppeteer
  resolves its own downloaded build correctly on its own (locally and in the Docker image).

### First-time setup

On first start with no saved session, the client prints a QR code to the server logs (stdout —
`docker logs`/Coolify's log viewer in prod). Scan it from the admin's phone: WhatsApp > Linked
Devices > Link a Device. After that, the session is written to `.wwebjs_auth/` (via `LocalAuth`)
relative to the working directory (`/app/apps/server` in the Docker image), so a restart doesn't
need a re-scan — **as long as that directory survives restarts**. On Coolify (or any platform that
gives the container a fresh filesystem on every deploy), mount a persistent volume at
`/app/apps/server/.wwebjs_auth`, otherwise every redeploy logs the WhatsApp session out and a human
has to scan the QR code again before notifications resume.
