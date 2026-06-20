# Commits the fix for the Coolify server build failure (node:sqlite under Bun).

Set-Location "C:\Users\kinzi\Desktop\projects\vva"

git add -- "apps/server/Dockerfile"
git commit -m "fix(server): install pnpm via standalone script instead of bun install -g

bun install -g pnpm runs pnpm's CLI under Bun's JS engine, and pnpm 11's
lockfile/store code imports node:sqlite, which Bun 1.3.14 doesn't
implement (error: No such built-in module: node:sqlite). Switch to
pnpm's standalone installer, which bundles its own Node runtime.

Also force NODE_ENV=development across the install/generate steps so a
build-time NODE_ENV=production injected by the platform can't cause
pnpm to skip devDependencies (which would drop the prisma CLI)."

git add -- "coolify-fix-commit.ps1"
git commit -m "chore: add coolify-fix-commit.ps1"

Write-Host "Done."
