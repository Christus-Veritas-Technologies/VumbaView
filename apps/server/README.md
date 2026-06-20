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
