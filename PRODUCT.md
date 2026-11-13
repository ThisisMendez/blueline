# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, deployed on Vercel. Supabase for authentication and PostgreSQL persistence. Model calls go through OpenRouter from a server route, with the model id read from one environment variable, never hardcoded. Settled in CLAUDE.md and the implementation spec; not an open decision.

## Users

A renter with a residential lease or renewal in hand and a signing decision approaching comes first. Landlords reviewing a residential lease are supported as a second review role. The review is scoped to residential leases. [ADR 0015](docs/adr/0015-renter-first-with-landlord-reviews.md). [Product requirements](PRD.md).

## Product Purpose

Blueline Redline helps a lease signer understand the agreement, see the terms that could affect them ranked by consequence, and prepare questions or proposed changes before deciding. Success means an independent evaluator can verify every flag's source and confirm no adjudicated high-severity term was missed for either role in a held-out test set.

## Positioning

“Review your rental agreement from your perspective.” Blueline Redline is a contract review app. The user picks their side, and the report highlights clauses that could harm it. It helps renters first, and landlords too, understand what could affect them and what to clarify before signing. Users decide how to act on the report. [Brand voice](BRAND.md).

## Operating Context

The signer selects renter or landlord, then pastes lease text or uploads selectable-text PDFs, including every referenced document. Files are parsed in the browser. The stored review uses extracted text and review data. A missing referenced document blocks review. The signer gets one report for the selected role, then may add personal red lines and open a counter-offer draft behind each flag's explanation. The role belongs to the review. Completed authenticated reviews stay in the library for 30 days automatically, or 90 days from an explicit save, with the expiry date visible. Document-grounded Q&A ("Ask about your agreement") is removed from the beta; the report offers no way to ask questions.

## Capabilities and Constraints

- Accepts pasted text and selectable-text PDFs only. No OCR, no scanned PDFs, no DOCX upload — uncertain extracted text would undermine exact-sentence citations.
- Every risk flag must show its exact source sentence, verified verbatim against the extracted text. A flag whose source can't be shown is a bug; invalid flags are retried or dropped, never displayed unsourced.
- A published, fixed coverage checklist (deposit deductions and return, early-exit costs, rent changes, repairs, access, dispute routes) reports "not found" items separately from cited risk flags. The model never invents its own checklist.
- The role shapes relevance, priority, severity, exposure, and next steps. Contract facts and supported readings stay consistent across roles.
- Severity measures potential harm to the selected role. Finding confidence reflects how strongly the contract supports the finding. V1 covers contract risk and ambiguity. V2 adds legal context where verified jurisdiction-specific evidence supports it. [Release boundaries](PRD.md#release-boundaries).
- Personal red lines produce a separate "preference match" list; they never change a term's general severity.
- Counter-offers address the selected role's exposure and aim at a plausible compromise for both parties. They appear after the signer opens the flag's explanation and show residual risk.
- Open configuration decision: which OpenRouter model, read from an env var. Open decision: whether a Supabase project exists yet — do not scaffold a throwaway project or mock auth to get past a missing key.
- Use “lease signer” for either party and “renter” or “landlord” for a specific review role. [Domain glossary](CONTEXT.md).

## Brand Commitments

Official public name: **Blueline Redline**. Internal/project shorthand: **Blueline**. Brand voice is calm, precise, and quietly defiant — show the source, explain the consequence, make room for a better reply. Agreements should feel like working documents, not intimidating legal artifacts. All user-facing copy runs through the humanizer skill before commit; copy that reads like a model wrote it is a defect. Visual direction (Blueprint navy `#123B5D`, Paper `#F6F1E7`, Signal red `#E5453A`) is recorded in BRAND.md and belongs to DESIGN.md, not here.

## Evidence on Hand

`research/summary.md` and its four source agent files hold the user research. Sourced, real complaints exist for gym/subscription surprise fees, non-compete clauses, and renter rights-waiver/arbitration clauses (Blind forum, BBB, Consumer Reports, FTC rulemaking). No direct willingness-to-pay evidence exists for this specific AI product — all pricing evidence is anchored to lawyer-review cost ($300–$660+ for lease review). The research did not measure how many renters currently self-review, use a free grader, or skip review entirely. Future work must not fabricate testimonials, pricing signals, or a competitive-gap claim stronger than what `research/agent3-what-already-exists.md` supports.

The original comparison considered enterprise legal tools such as LawGeex, Ironclad, and Spellbook and consumer tools such as ToS;DR, LeaseCheck, and LeaseAI. It did not verify a unique feature gap. [Competitor research](research/agent3-what-already-exists.md).

## Product Principles

1. A claim without a verifiable source sentence is not a claim Blueline makes — citation-worthiness gates every risk flag before severity does.
2. Absence is not danger and unusual wording is not risk; only plausible material consequence earns a flag or a "not found" item.
3. General risk and personal preference are two different rankings and must never be merged into one score.
4. Prefer catching a serious harm and accepting an occasional false alarm over a quieter report that misses one.
5. Expansion beyond lease signers requires independent trust evidence (verified citations, no missed adjudicated high-severity term), never satisfaction or willingness-to-pay signals alone.

## Accessibility & Inclusion

WCAG 2.1 AA conformance is the stated target for this product.
