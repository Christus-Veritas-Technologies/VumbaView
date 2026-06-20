# Build from the monorepo root: docker build -f apps/server/Dockerfile .
FROM oven/bun:1
WORKDIR /app

# Prisma's query engine needs OpenSSL; ca-certificates for TLS to a managed
# Postgres (Neon/Supabase/RDS with sslmode=require, etc.); curl to fetch the
# pnpm standalone installer below. The pnpm standalone binary is a compiled
# glibc build that dynamically links libatomic — not installed by default on
# this image ("libatomic.so.1: cannot open shared object file") — hence
# libatomic1 here too.
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates curl libatomic1 \
  && rm -rf /var/lib/apt/lists/*

# Bun is the runtime, but installs go through pnpm. pnpm-workspace.yaml uses
# the `catalog:` protocol for shared dependency versions (zod, typescript,
# dotenv, ...) which `bun install` doesn't resolve the same way pnpm's
# workspace linker does — so we need pnpm itself, not `bun install`.
#
# `bun install -g pnpm` looks like the obvious way to get it, but it runs
# pnpm's CLI *under Bun's own JS engine*, and pnpm 11's lockfile/store code
# imports `node:sqlite` — a Node built-in Bun 1.3.14 doesn't implement yet
# ("error: No such built-in module: node:sqlite"). pnpm's standalone
# installer ships its own self-contained Node runtime, sidestepping Bun
# entirely for this one step.
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=11.4.0 sh -

# Coolify (and similar platforms) can inject NODE_ENV=production as a
# build-time variable; pnpm treats that the same as `--prod` and silently
# skips devDependencies — which would drop the `prisma` CLI needed below for
# `prisma generate`. Force it back until the runtime ENV near the bottom.
ENV NODE_ENV=development

# Manifests + lockfile first, for layer caching. apps/server only needs
# @vva/env (runtime) and @vva/config (tsconfig base) from packages/ — the
# web and reception apps are left out of this image on purpose.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/env/package.json packages/env/
COPY apps/server/package.json apps/server/

# prisma.config.ts (Prisma 7) reads DATABASE_URL through prisma/config's
# `env()` helper, which throws if the variable is missing entirely — so even
# `prisma generate`, which never touches a real database, fails at build
# time without *something* set here. Pass the real value at `docker run`
# (along with JWT_SECRET, which has no build-time dependency and is only
# validated at container startup).
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm install --frozen-lockfile

# Source after install for better layer caching.
COPY packages/config/ packages/config/
COPY packages/env/ packages/env/
COPY apps/server/ apps/server/

RUN pnpm --filter server db:generate

ENV NODE_ENV=production
ENV PORT=3000
ENV CORS_ORIGIN=http://localhost:3001
EXPOSE 3000

# No build step on purpose: apps/server has no build/dist script (unlike the
# reference this was adapted from) — Bun runs the TypeScript source directly,
# same as the project's own "dev" script.
WORKDIR /app/apps/server
CMD ["bun", "run", "src/index.ts"]
