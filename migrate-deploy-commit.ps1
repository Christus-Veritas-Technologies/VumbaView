# Commits the "run migrations automatically on deploy" changes. Safe to
# re-run — Commit() skips any file with nothing staged.
#
# NOTE: this does NOT include the actual init migration SQL — that still
# needs to be generated locally (see apps/server/README.md, "Generating a
# migration without a reachable database") and committed separately, since
# its content depends on running the Prisma CLI against the live schema.

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

Commit "feat(server): add db:migrate:deploy script" `
  @("apps/server/package.json")

Commit "feat(server): run prisma migrate deploy on container startup before serving traffic" `
  @("apps/server/Dockerfile")

Commit "chore(server): add migrations lock file (postgresql)" `
  @("apps/server/prisma/migrations/migration_lock.toml")

Commit "docs(server): document no-DB migration generation and prod auto-deploy flow" `
  @("apps/server/README.md")

Commit "chore: add migrate-deploy-commit.ps1" `
  @("migrate-deploy-commit.ps1")

Write-Host "Done."
