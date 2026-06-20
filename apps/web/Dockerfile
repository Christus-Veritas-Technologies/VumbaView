# Build from the monorepo root: docker build -f apps/web/Dockerfile .
FROM node:22-slim AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

# Copy workspace manifests + lockfile first for layer caching.
# apps/server (Bun/Hono) and apps/reception (Expo) are excluded on purpose —
# the web app only needs packages/config, packages/env, packages/ui, itself.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/config/package.json packages/config/
COPY packages/env/package.json packages/env/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/

# NEXT_PUBLIC_API_URL is read by packages/env/src/web.ts (imported at the top
# of next.config.ts) and gets baked into the client bundle at build time —
# it is NOT read at container runtime. Override via:
#   --build-arg NEXT_PUBLIC_API_URL=https://your-api.example.com
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm install --frozen-lockfile

# Source after install for better layer caching.
COPY packages/config/ packages/config/
COPY packages/env/ packages/env/
COPY packages/ui/ packages/ui/
COPY apps/web/ apps/web/

RUN pnpm --filter web build

# ---- Runner ----
FROM node:22-slim AS runner
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate

# next.config.ts doesn't set `output: "standalone"`, so `next start` needs
# the full node_modules tree rather than a pruned bundle — copied wholesale
# from the builder instead of reinstalled here.
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages ./packages

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
WORKDIR /app/apps/web
EXPOSE 3001
CMD ["pnpm", "start"]
