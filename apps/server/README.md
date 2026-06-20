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
pnpm db:migrate -- --name init   # create + apply a migration
pnpm db:seed              # seed demo data — Prisma 7 no longer auto-seeds after migrate
pnpm db:studio            # open Prisma Studio
```
