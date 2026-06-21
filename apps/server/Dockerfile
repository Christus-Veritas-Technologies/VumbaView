# Build from the monorepo root: docker build -f apps/server/Dockerfile .
FROM oven/bun:1
WORKDIR /app

# Prisma's query engine needs OpenSSL; ca-certificates for TLS to a managed
# Postgres (Neon/Supabase/RDS with sslmode=require, etc.); curl to fetch the
# pnpm standalone installer below. The pnpm standalone binary is a compiled
# glibc build that dynamically links libatomic — not installed by default on
# this image ("libatomic.so.1: cannot open shared object file") — hence
# libatomic1 here too.
#
# The rest of this list is whatsapp-web.js's headless-Chromium runtime deps —
# shared libraries Chromium itself needs, not Chromium (puppeteer's own
# postinstall, in `pnpm install` below, downloads that). Adapted from
# whatsapp-web.js's "no-gui systems" install guide
# (https://wwebjs.dev/guide/installation.html#installation-on-no-gui-systems)
# and cross-checked against Puppeteer's own current Debian dependency list
# (https://pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux), since this
# image is Debian 12 (bookworm), not the older Ubuntu that doc's list targets:
# dropped gconf-service/libgconf-2-4/libappindicator1/libgdk-pixbuf2.0-0 (GConf
# and this appindicator package no longer exist in bookworm's repos — `apt-get
# install` fails entirely if any single package name is invalid), swapped
# libgbm-dev for libgbm1 (only the runtime .so is needed, not dev headers),
# and added libatk-bridge2.0-0 (missing from that doc's list, present on
# Puppeteer's).
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates curl libatomic1 \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 \
    libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
    libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 \
    libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
    libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
    lsb-release wget xdg-utils \
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
# The installer puts the actual binary in $PNPM_HOME/bin, not $PNPM_HOME
# itself — confirmed by its own printed setup instructions ("export
# PATH=\"$PNPM_HOME/bin:$PATH\""). Missing /bin here is exactly why the next
# step previously failed with "pnpm: not found".
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
# The installer's post-install step runs `pnpm setup`, which tries to detect
# the calling shell to patch its profile file — `docker build`'s /bin/sh -c
# has no $SHELL set, so it fails with ERR_PNPM_UNKNOWN_SHELL. We already set
# PNPM_HOME/PATH ourselves above, so the shell only needs to exist, not be
# "right".
ENV SHELL=/bin/bash
# `pnpm --version` at the end makes this step itself fail fast (with a clear
# error, at this line) if the binary still isn't reachable, instead of
# surfacing as a confusing "pnpm: not found" one step later.
RUN curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=11.4.0 sh - \
  && pnpm --version

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

# prisma.config.ts (Prisma 7) reads DIRECT_URL through prisma/config's
# `env()` helper, which throws if the variable is missing entirely — so even
# `prisma generate`, which never touches a real database, fails at build
# time without *something* set here. DATABASE_URL is also required (it's what
# src/db.ts's PrismaPg adapter uses at runtime). Pass the real values at
# container start (along with JWT_SECRET, which has no build-time dependency
# and is only validated at startup) — these build-time defaults are dummies.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DATABASE_URL=${DATABASE_URL}
ARG DIRECT_URL=postgresql://build:build@localhost:5432/build
ENV DIRECT_URL=${DIRECT_URL}

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

# Apply any migrations that exist in prisma/migrations/ but haven't been
# recorded as applied yet, before the server starts taking traffic. This runs
# at container *startup*, not build time, on purpose:
#  - it needs the real DIRECT_URL (prisma.config.ts's datasource — see there
#    for why migrations use the direct, not pooled, connection on Prisma
#    Postgres), which Coolify injects at runtime, not the `build:build@
#    localhost` placeholder ARG'd in above
#  - it needs to be on the same network as the database, which only the
#    running container (not the build step) is guaranteed to be
# `migrate deploy` only applies un-applied migration files — it's a no-op if
# everything's already up to date, so this is safe to run on every restart.
# `exec` replaces the shell with the bun process so it keeps receiving signals
# (e.g. SIGTERM) directly for a clean shutdown, instead of going to the shell.
CMD ["sh", "-c", "pnpm run db:migrate:deploy && exec bun run src/index.ts"]
