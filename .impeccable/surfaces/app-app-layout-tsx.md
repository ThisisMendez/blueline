---
version: 1
slug: "app-app-layout-tsx"
primary_target: "src/app/(app)/layout.tsx"
related_targets: []
---

# App shell

Scope: the app frame that holds paste/upload intake, the review result (summary, ranked flags, clean verdict), the question box, the reader's red lines, and the library. Analysis is available anonymously and remains ephemeral; only personal red lines and the library require an account. Visitor mode: Operate.

## Audience, job, task, states, constraints

- **Audience**: the same lease signer, now signed in and doing the actual work of a review, not being persuaded to start one.
- **Task**: paste or upload a complete packet; read a plain-English summary, ranked cited flags, and the coverage checklist's not-found items; ask document-grounded questions; edit personal red lines and rerun; open a counter-offer behind a flag's explanation; return to or save a review from the library.
- **Important states**: intake (pasting/uploading), blocked on a missing referenced document, general review complete, personalized rerun with preference matches, a clean review with no material flags, an expiring/expired review, a Q&A exchange, a revealed counter-offer with residual risk, the library list with visible expiry dates.
- **Frequency**: infrequent per signer (a lease decision doesn't come up often) but high-attention and text-dense when it does; sessions can run long.
- **Constraints**: WCAG 2.1 AA; no safe-to-sign or legal-validity language anywhere in the frame; every flag shows its source sentence; not-found items stay visually distinct from risk flags; preference matches stay visually distinct from general severity; a counter-offer is revealed only after its flag's explanation is opened; library expiry dates are always visible, never inferred.

## Direction contract

THESIS: The same field-guide specimen system, now the reader's own workbench — where the landing page demonstrated identification on one clause, this frame lets the reader run that identification across their whole document, at task speed. It refuses a generic dashboard-card chrome that would abandon the specimen-card language the moment sign-in happens.

OWN-WORLD: The same tokens as the landing page — Blueprint navy `#123B5D`, Paper `#F6F1E7`, Signal red `#E5453A` — restrained for Operate: paper and navy carry the frame, signal red narrows further to only risk/severity marks and the single active state, never chrome or navigation. The specimen card's leader-line-and-label convention becomes the risk-flag component; the strict shared grid becomes the page's task layout (intake zone, results list, a side panel for red lines and Q&A).

STORY: A signer signs in, pastes or uploads their complete packet, and watches their own document render into a chain of specimen cards — the identification language they saw demonstrated on the landing page, now doing the work on their lease. They scan ranked flags, open one for its counter-offer, ask the question box something the document may or may not answer, edit their red lines and rerun, and can return later through the library before it expires.

FIRST VIEWPORT: Deferred. No screen in this frame is built today; the frame's chrome (navigation, intake state, and the results list's specimen-card layout) carries the OWN-WORLD tokens and grid from first paint, and its exact composition is resolved when this surface is scheduled for build, not guessed here.

FORM: The Field Guide, inherited from the landing page's direction round rather than a separate roll — seed key e08aee80, assigned index 7 on re-roll 1 — applied in Operate-mode composition per this round's brief to cover both surfaces at once.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. Not triggered today — applies when this surface is actually built.

## Unresolved decisions

- Composition of each individual state (intake, blocked, results, Q&A, red-lines editor, library) — deferred to when this surface is scheduled for build.
- The interaction model for switching between the general review and a personalized rerun view.
- Auth timing follows the 2026-09-22 build decision: anonymous analysis is available; library and personal red lines require an account. The sign-in screen retains this design system.
