---
version: 1
slug: "app-page-tsx"
primary_target: "src/app/(marketing)/page.tsx"
related_targets: []
---

# Landing page

Scope: the public, unauthenticated marketing route (`/`). Visitor mode: Persuade.

## Audience, job, action, proof, constraints

- **Audience**: the lease signer named in PRD.md — a renter with a residential lease or renewal in hand, deciding soon whether to sign, not a general shopper for legal advice.
- **Job**: understand in seconds what Blueline Redline does and decide whether to try it on their own document.
- **Action**: exactly one — sign in and start a review. No secondary CTA, no pricing tier picker.
- **Proof/content**: one worked demonstration — a real (or clearly labeled synthetic) lease clause turning into a ranked, cited flag, live on the page. No testimonial, customer, statistic, or case study (none exist; PRODUCT.md's Evidence on Hand is explicit about this).
- **Constraints**: real product name only ("Blueline Redline"); no verdict on whether to sign; no legal-advice claim; no scanned/photographed-document claim (paste + selectable-text PDF only); no document types beyond residential leases; free-to-use-for-this-version stated plainly, no other pricing claim; WCAG 2.1 AA; all copy through the humanizer skill before commit.

## Direction contract

THESIS: The lease clause as a field-guide specimen. The one idea this surface owns is identification, not persuasion — it teaches the visitor to spot a risky clause the way a field guide teaches you to spot a bird, and refuses the category default of hero claim, feature grid, and testimonial carousel.

OWN-WORLD: Blueprint navy `#123B5D`, Paper `#F6F1E7`, Signal red `#E5453A` (BRAND.md's pinned palette, translated into this world rather than reinvented). Paper is the specimen-card ground; navy carries diagnostic leader lines, labels, and structural type; signal red is reserved for the circled/cited risk mark and the severity badge — never a general accent or button color. Every element on the card locks to one strict shared grid, nothing floats free of it. Leader lines run from exact clause words to plain-language margin notes, in a field guide's callout convention, not tooltip or card-UI chrome.

STORY: The visitor doesn't arrive to a claim about the product — they arrive to one lease clause already "identified." A demo specimen runs automatically before they upload anything: a clause circled, labeled, severity-badged, and cited. Within seconds they understand what a risky sentence looks like once labeled, and that the product does this to their own document. The one action is to try it themselves.

FIRST VIEWPORT: The hero IS the specimen card at rest, not a header above a screenshot — full width, the demo clause set large and precise on paper stock, red leader lines already drawn to two or three diagnostic labels, a severity badge upper right, the exact source sentence quoted along the foot like a field guide's collection citation. The single CTA sits directly beneath the card. A persistent marker anchors the moment (e.g. "Specimen 1 of 1 — try your own"). No nav feature-grid competes with it above the fold.

FORM: The Field Guide (naturalist field identification guide). Assigned index 7 of the grounded direction list on re-roll 1 (round 1 was a plain re-roll with no steer); seed key e08aee80.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved decisions

- The landing CTA may lead through sign-in, but anonymous review is also available from that screen; only library and personal red lines require an account, per the 2026-09-22 build decision.
- Exact wording of the demo specimen's clause and flag copy is authored during build, run through the humanizer skill, and checked against PRODUCT.md's Evidence on Hand before commit.
