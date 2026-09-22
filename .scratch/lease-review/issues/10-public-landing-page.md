# 10: Public landing page

**What to build:** A public, unauthenticated landing page that is the product's front door — the one Persuade-mode surface in this product; everything past sign-in is Operate mode. It states what Blueline Redline does — plain-English summary, cited risk flags, coverage checklist, document-grounded Q&A, counter-offers, an editable personal red-line list, and a saved library — in the calm, precise, quietly defiant voice from BRAND.md, leads with the mechanism rather than an emotional appeal, and its single primary call to action is to sign in and start a review.

**Blocked by:** None (can start immediately) — "sign in to start" only needs Supabase auth wired up, not the review flow itself.

**Status:** done

- [x] The page is reachable without authentication.
- [x] Copy names the product's actual capabilities (summary, cited risk flags, coverage checklist, Q&A, counter-offers, personal red lines, saved library) and nothing it doesn't do.
- [x] The hero states the product's mechanism (cited flags with exact source sentence, coverage checklist, drafted counter-offer) rather than opening on an emotional appeal.
- [x] Any "proof" element is a worked example (a sample cited flag, its source sentence, its counter-offer) — no testimonial, statistic, case study, or customer claim, per BRAND.md's landing-page section and PRODUCT.md's Evidence on Hand.
- [x] Copy makes no legal-validity, safe-to-sign, or outcome-guarantee claim.
- [x] The page states the product is free to use for this version, without implying that stays true later, and makes no other pricing claim.
- [x] Visual direction follows BRAND.md's landing-page section: Blueprint navy and Paper structure the page; Signal red is reserved for consequential-term moments (e.g. the sample flag), not used as a general accent or CTA color.
- [x] There is exactly one primary CTA — sign in to start a review — stated plainly, not softened into trial-style language.
- [x] All user-facing copy runs through the humanizer skill before commit.
- [x] The page meets WCAG 2.1 AA.
- [x] An independent reviewer checks the shipped copy against this checklist's claims constraints before this ticket is considered done (per the spec's Testing Decisions).
