# Codex implementation prompt

Implement the approved Blueline Lease homepage visual refresh in the existing repository. Read `docs/design/homepage-visual-refresh.md`, open `docs/design/approved-homepage-mockup.png`, and review `BRAND.md`, `DESIGN.md`, and `docs/version-control.md`.

Before editing, inspect the current branch and worktree, homepage and shared components, token definitions, logos and images, and Vercel deployment mapping. Open the intended staging Preview and record its commit, exact computed colors, current copy, routes, and desktop and mobile structure. Use the verified staging palette, including its warm paper tones. Write a short implementation plan listing each component, asset, and verification step before changing files. Report any staging details you cannot verify.

Work in an isolated feature branch from the verified baseline. Make the smallest homepage changes needed to add Spotter holding a fictional lease with blue and red highlights, photo overlays on the existing renter and landlord sample links, compact icons for the existing coverage list, and a worked fictional report excerpt with a small Spotter peek. Use the approved image to guide the art and the existing fixture for the report language. Track missing art or approvals clearly and keep the page usable while those items are pending.

Preserve the official logo and wordmark, exact current wording and calls to action, nav and anchors, both sample report destinations, and the explicit renter/landlord choice in `/review`. Keep upload and processing, auth and account, saving, and report behavior intact. Preserve verbatim source citations, role-specific risk language, and the neutral document-only boundary. Keep the change local to presentation and new assets.

Run the repository's lint, typecheck, test, build, and deterministic smoke commands. Check desktop, tablet, and mobile, including keyboard navigation, screen-reader output, contrast, zoom, image failure, and layout stability. Exercise both sample reports and both intake paths with synthetic fixtures. Report any hosted auth or end-to-end behavior that remains unverified. Record load performance and before-and-after screenshots.

Deploy only to the protected Vercel Preview for the feature branch after verifying the target and staging service isolation. Share the immutable Preview URL, commit, screenshots, checks, deviations, and rollback baseline for review. Production deployment, promotion, and any merge to `main` require my explicit approval.
