# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js, deployed on Vercel. Supabase for authentication and PostgreSQL persistence. Model calls go through OpenRouter from a server route, with the model id read from one environment variable, never hardcoded. Settled in CLAUDE.md and the implementation spec; not an open decision.

## Users

A renter with a residential lease or renewal in hand who must decide soon whether to sign. They have the document, a deadline, and are deciding whether to sign, not browsing general contract advice or resolving a dispute after signing. The first version serves only this signer; other contract types (freelance, employment, subscriptions, Terms of Service) are explicitly out of scope for now.

## Product Purpose

Blueline Redline helps a lease signer understand the agreement they were given, see the terms that could hurt them ranked by real consequence, and consider a plausible counter-offer before they decide. It exists because a signer can miss a costly exit term, deposit condition, or dispute-rights change even when they read the lease themselves, and because today's alternatives are self-review, a free consumer grader, or a $300–$660+ lawyer review. Success means an independent evaluator can verify every flag's source sentence and confirm no adjudicated high-severity term in a held-out test set was missed — not user satisfaction or willingness to pay alone.

## Positioning

No competitor found in research combines plain-English summary, severity-ranked and cited risk flags, a drafted counter-offer per flag, and document-grounded Q&A in one consumer-facing flow. Enterprise/legal-ops tools (LawGeex, Ironclad, Spellbook) serve legal teams at $550/mo–$200K/year and assume contract literacy the target user doesn't have. Consumer graders (ToS;DR, LeaseCheck, LeaseAI) summarize and flag but don't draft a counter-offer or answer grounded follow-up questions. This is an absence-of-evidence finding, not a confirmed unique claim.

## Operating Context

The signer pastes lease text or uploads selectable-text PDFs, including every document the lease references (fee schedules, rules, addenda). The product parses files in the browser and stores only extracted text, never the original file. A missing referenced document blocks review entirely rather than producing a partial one. The signer reads a general review first, then may add personal red lines and rerun the analysis, ask document-grounded follow-up questions, and open a counter-offer draft behind each flag's explanation. Completed reviews live in an authenticated library for 30 days automatically, or 90 days from an explicit save, with the expiry date always visible.

## Capabilities and Constraints

- Accepts pasted text and selectable-text PDFs only. No OCR, no scanned PDFs, no DOCX upload — uncertain extracted text would undermine exact-sentence citations.
- Every risk flag must show its exact source sentence, verified verbatim against the extracted text. A flag whose source can't be shown is a bug; invalid flags are retried or dropped, never displayed unsourced.
- A published, fixed coverage checklist (deposit deductions and return, early-exit costs, rent changes, repairs, access, dispute routes) reports "not found" items separately from cited risk flags. The model never invents its own checklist.
- Severity is based on plausible material consequence to the signer, not on how unusual the wording is or a model judgment about legal enforceability.
- The product never issues a safe-to-sign or legal-validity verdict. A clean review says "no material flags found in the text reviewed," not that the lease is safe.
- Personal red lines produce a separate "preference match" list; they never change a term's general severity.
- Counter-offers aim at a plausible compromise a landlord might accept, revealed only after the signer opens the flag's explanation, always showing residual risk.
- Open configuration decision: which OpenRouter model, read from an env var. Open decision: whether a Supabase project exists yet — do not scaffold a throwaway project or mock auth to get past a missing key.
- Vocabulary is fixed by CONTEXT.md (e.g. "lease signer" not "renter," "risk flag" requires a stated consequence, "clean review" is not "safe lease"). Use those terms, not the ones the glossary lists to avoid.

## Brand Commitments

Official public name: **Blueline Redline**. Internal/project shorthand: **Blueline**. Brand voice is calm, precise, and quietly defiant — show the source, explain the consequence, make room for a better reply. Agreements should feel like working documents, not intimidating legal artifacts. All user-facing copy runs through the humanizer skill before commit; copy that reads like a model wrote it is a defect. Visual direction (Blueprint navy `#123B5D`, Paper `#F6F1E7`, Signal red `#E5453A`) is recorded in BRAND.md and belongs to DESIGN.md, not here.

## Evidence on Hand

`research/summary.md` and its four source agent files hold the user research. Sourced, real complaints exist for gym/subscription surprise fees, non-compete clauses, and renter rights-waiver/arbitration clauses (Blind forum, BBB, Consumer Reports, FTC rulemaking). No direct willingness-to-pay evidence exists for this specific AI product — all pricing evidence is anchored to lawyer-review cost ($300–$660+ for lease review). The research did not measure how many renters currently self-review, use a free grader, or skip review entirely. Future work must not fabricate testimonials, pricing signals, or a competitive-gap claim stronger than what `research/agent3-what-already-exists.md` supports.

## Product Principles

1. A claim without a verifiable source sentence is not a claim Blueline makes — citation-worthiness gates every risk flag before severity does.
2. Absence is not danger and unusual wording is not risk; only plausible material consequence earns a flag or a "not found" item.
3. General risk and personal preference are two different rankings and must never be merged into one score.
4. Prefer catching a serious harm and accepting an occasional false alarm over a quieter report that misses one.
5. Expansion beyond lease signers requires independent trust evidence (verified citations, no missed adjudicated high-severity term), never satisfaction or willingness-to-pay signals alone.

## Accessibility & Inclusion

WCAG 2.1 AA conformance is the stated target for this product.
