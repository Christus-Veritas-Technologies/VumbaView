# Commits the Dockerfiles for apps/server and apps/web, plus the root
# .dockerignore, one commit per file.

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

Commit "feat(server): add Dockerfile (Bun runtime, pnpm install, Prisma 7 generate)" `
  @("apps/server/Dockerfile")

Commit "feat(web): add multi-stage Dockerfile (Next.js build + runner)" `
  @("apps/web/Dockerfile")

Commit "chore: add root .dockerignore" `
  @(".dockerignore")

Commit "chore: add dockerfiles-commits.ps1" `
  @("dockerfiles-commits.ps1")

Write-Host "Done. Dockerfiles committed."
