# Commits the DATABASE_URL (pooled) / DIRECT_URL (direct) split needed for
# Prisma Postgres. Safe to re-run — Commit() skips any file with nothing
# staged.
#
# Before this lands in prod: add DIRECT_URL (the db.prisma.io, not
# pooled.db.prisma.io, connection string) as a runtime env var in Coolify for
# the server app. Without it, prisma.config.ts throws on container start and
# the migrate-deploy step (and therefore the whole deploy) fails.

Set-Location "C:\Users\kinzi\Desktop\projects\vva"

function Commit($message, $paths) {
  git add -- $paths
  $staged = git diff --cached --name-only
  if ($staged) {
    git commit -m $message
  } else {
    Write-Host "Skipping (nothing staged): $message"
  }
}

Commit "fix(server): point prisma.config.ts at DIRECT_URL, not the pooled connection string" `
  @("apps/server/prisma.config.ts")

Commit "fix(server): add DIRECT_URL build-time placeholder alongside DATABASE_URL" `
  @("apps/server/Dockerfile")

Commit "docs(server): document DATABASE_URL vs DIRECT_URL for Prisma Postgres" `
  @("apps/server/.env.example", "apps/server/README.md")

Commit "chore: add prisma-postgres-direct-url-commit.ps1" `
  @("prisma-postgres-direct-url-commit.ps1")

Write-Host "Done."
