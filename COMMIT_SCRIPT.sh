#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || git init

git add PLAN.md
git commit -m "docs: add VumbaView Academy site build plan"

git add packages/ui/src/styles/globals.css
git commit -m "style(ui): apply teal & gold theme tokens"

git add apps/web/next.config.ts
git commit -m "feat(web): allow Unsplash remote images"

git add apps/web/src/lib/site-config.ts
git commit -m "feat(web): add site configuration constants"

git add apps/web/src/lib/images.ts
git commit -m "feat(web): add sourced image manifest"

git add apps/web/src/components/marketing/container.tsx apps/web/src/components/marketing/eyebrow.tsx apps/web/src/components/marketing/section-heading.tsx
git commit -m "feat(web): add shared marketing UI primitives"

git add apps/web/src/components/header.tsx
git commit -m "feat(web): build site header with nav and Apply Now CTA"

git add apps/web/src/components/footer.tsx
git commit -m "feat(web): build site footer"

git add apps/web/src/app/layout.tsx
git commit -m "feat(web): wire header/footer into root layout, update metadata, mount toaster"

git add apps/web/src/components/home/hero.tsx
git commit -m "feat(home): build hero section"

git add apps/web/src/components/home/welcome-intro.tsx
git commit -m "feat(home): build welcome intro and quick-links grid"

git add apps/web/src/components/home/history-snippet.tsx
git commit -m "feat(home): build founding history snippet section"

git add apps/web/src/components/home/mission-vision-teaser.tsx
git commit -m "feat(home): build mission and vision teaser section"

git add apps/web/src/components/home/head-quote.tsx
git commit -m "feat(home): build head of school quote section"

git add apps/web/src/components/home/academic-pathways-preview.tsx
git commit -m "feat(home): build academic pathways preview section"

git add apps/web/src/components/home/facilities-gallery-preview.tsx
git commit -m "feat(home): build facilities and activities gallery preview section"

git add apps/web/src/components/home/closing-cta.tsx
git commit -m "feat(home): build closing admissions CTA band"

git add apps/web/src/app/page.tsx
git commit -m "feat(home): assemble home page"

git add apps/web/src/components/marketing/page-hero.tsx
git commit -m "feat(web): add shared PageHero primitive for About hero banner"

git add apps/web/src/components/about/history-story.tsx
git commit -m "feat(about): build full history and story section"

git add apps/web/src/components/about/mission-vision-values.tsx
git commit -m "feat(about): build mission, vision and values section"

git add apps/web/src/components/about/head-welcome.tsx
git commit -m "feat(about): build head of school welcome message section"

git add apps/web/src/components/about/leadership-highlight.tsx
git commit -m "feat(about): build leadership team highlight section"

git add apps/web/src/components/marketing/page-cta.tsx
git commit -m "feat(web): add shared PageCta primitive for About closing CTA"

git add apps/web/src/app/about/page.tsx
git commit -m "feat(about): assemble about page"

git add apps/web/src/components/academics/pathway-cards.tsx
git commit -m "feat(academics): build curriculum pathway cards"

git add apps/web/src/components/academics/curriculum-pillars.tsx
git commit -m "feat(academics): build curriculum pillars section"

git add apps/web/src/components/academics/facilities-labs-grid.tsx
git commit -m "feat(academics): build facilities and labs grid"

git add apps/web/src/components/academics/extracurriculars.tsx
git commit -m "feat(academics): build extracurricular activities section"

git add apps/web/src/app/academics/page.tsx
git commit -m "feat(academics): assemble academics page"

git add apps/web/src/components/admissions/process-steps.tsx
git commit -m "feat(admissions): build admissions process steps section"

git add apps/web/src/components/admissions/requirements-dates.tsx
git commit -m "feat(admissions): build requirements and key dates section"

git add packages/ui/src/components/textarea.tsx
git commit -m "feat(ui): add textarea primitive"

git add apps/web/src/components/admissions/inquiry-form.tsx
git commit -m "feat(admissions): build admissions inquiry form with validation"

git add apps/web/src/components/admissions/faq-section.tsx
git commit -m "feat(admissions): build admissions FAQ section"

git add apps/web/src/app/admissions/page.tsx
git commit -m "feat(admissions): assemble admissions page"

git add apps/web/src/components/contact/contact-info-cards.tsx
git commit -m "feat(contact): build contact info cards section"

git add apps/web/src/components/contact/location-map.tsx
git commit -m "feat(contact): build location and map section"

git add apps/web/src/components/contact/contact-form.tsx
git commit -m "feat(contact): build contact form with validation"

git add apps/web/src/app/contact/page.tsx
git commit -m "feat(contact): assemble contact page"

git add -A
git diff --cached --quiet || git commit -m "chore: final polish and QA pass"

echo "Done. Run 'git log --oneline' to review."
