# Commits this round's reception (Expo) changes, plus the earlier Dockerfile
# round in case that script hasn't been run yet. Safe to run even if it has —
# Commit() skips any file with nothing staged.

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

# --- Dockerfiles (previous round, included here for convenience) ---

Commit "feat(server): add Dockerfile (Bun runtime, pnpm install, Prisma 7 generate)" `
  @("apps/server/Dockerfile")

Commit "feat(web): add multi-stage Dockerfile (Next.js build + runner)" `
  @("apps/web/Dockerfile")

Commit "chore: add root .dockerignore" `
  @(".dockerignore")

Commit "chore: add dockerfiles-commits.ps1" `
  @("dockerfiles-commits.ps1")

# --- Reception: allow HTTP + build APK instead of AAB ---

Commit "feat(reception): allow plain HTTP traffic in dev and production (Android + iOS)" `
  @("apps/reception/package.json", "apps/reception/app.json")

Commit "feat(reception): build APK instead of AAB for production Android builds" `
  @("apps/reception/eas.json")

Commit "chore: add reception-and-docker-commits.ps1" `
  @("reception-and-docker-commits.ps1")

Write-Host "Done."
