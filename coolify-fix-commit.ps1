# Commits fixes for the Coolify server build failures. Safe to re-run even if
# some of these were already committed in a previous run — Commit() skips any
# file with nothing staged.

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

Commit "fix(server): install pnpm via standalone script instead of bun install -g" `
  @("apps/server/Dockerfile")

Commit "chore: add coolify-fix-commit.ps1" `
  @("coolify-fix-commit.ps1")

Write-Host "Done."
