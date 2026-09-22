# Blueline lease review — implementation spec

Status: ready-for-agent

## Problem Statement

A lease signer with a residential lease or renewal in hand must decide soon whether to sign. The cost, exit, deposit, and dispute terms that could change that decision may be easy to miss or may sit in referenced material outside the main lease. The signer needs to see a concrete consequence and its exact source sentence before deciding, without being given an unsupported claim that the lease is safe or that a term is legally invalid.

## Solution

Blueline accepts a complete agreement as pasted text or selectable-text PDFs, blocks review when referenced documents are missing, and gives a general review before asking for personal red lines. It returns a plain-English summary, ranked and cited risk flags, a separate published coverage checklist with not-found items, document-grounded answers, and a plausible counter-offer for each flag. The signer can then add red lines and rerun for separate preference matches. Reviews remain in an authenticated library for 30 days automatically or 90 days from an explicit save. The first version serves lease signers only.

## User Stories

0. As a prospective lease signer who has not yet started a review, I want a public landing page that explains what Blueline Redline does and why, so that I can decide whether to start before I paste anything.
1. As a lease signer, I want to paste lease text, so that I can review an agreement without preparing a file.
2. As a lease signer, I want to provide a PDF with selectable text, so that I can review the document I received from the landlord.
3. As a lease signer, I want to know when a PDF has no usable selectable text, so that I do not mistake an unreviewable scan for a clean lease.
4. As a lease signer, I want to provide the fee schedules, rules, and addenda my lease references, so that the review covers the complete agreement.
5. As a lease signer, I want Blueline to name each referenced document it cannot find in my packet, so that I know what to obtain.
6. As a lease signer, I want an incomplete packet to stop before analysis, so that partial text cannot produce false reassurance.
7. As a lease signer, I want to know when the complete agreement is ready for review, so that I can distinguish waiting for documents from waiting for analysis.
8. As a lease signer, I want a plain-English summary of the complete agreement, so that I can orient myself before reading individual warnings.
9. As a lease signer, I want risk flags ranked by severity, so that I can spend limited time on the most consequential terms first.
10. As a lease signer, I want each risk flag to show the exact sentence and the document it came from, so that I can check it in the agreement.
11. As a lease signer, I want each risk flag to describe a plausible downside, so that I know why the cited sentence matters.
12. As a lease signer, I want each uncertain warning to say what would have to happen for the downside to occur, so that I can judge whether that situation applies to me.
13. As a lease signer, I want a materially harmful common clause to be flagged, so that ordinary wording does not hide a serious consequence.
14. As a lease signer, I want harmlessly unusual wording left out of the risk list, so that novelty is not confused with danger.
15. As a lease signer, I want a flag with an unverified quotation withheld, so that fluent but unsupported model output cannot appear as evidence.
16. As a lease signer, I want deposit forfeiture or broad deductions assessed by the amount I could lose, so that a decision-changing loss can rank high.
17. As a lease signer, I want early-exit and reassignment charges assessed by their possible total cost, so that an open-ended obligation can rank above a bounded fee.
18. As a lease signer, I want dispute-rights waivers assessed by the practical route the lease says I would lose, so that process changes are explained without unsupported enforceability claims.
19. As a lease signer, I want other lease terms flagged when the text supports a plausible material downside, so that the initial clause priorities do not become a closed list.
20. As a lease signer, I want a clean review to say that no material flags were found in the text reviewed, so that I can understand the result without mistaking it for a safe-to-sign guarantee.
21. As a lease signer, I want the published coverage checklist to include deposit deductions and return, early-exit costs, rent changes, repairs, access to the home, and dispute routes, so that I can see which expected topics were checked.
22. As a lease signer, I want an absent checklist topic shown as a not-found item rather than a risk flag, so that a missing sentence is not presented as cited evidence.
23. As a lease signer, I want a not-found item to avoid claiming the lease is unlawful, so that I do not confuse silence in the document with a legal conclusion.
24. As a lease signer, I want to ask a follow-up question about the complete agreement, so that I can clarify a term before deciding.
25. As a lease signer, I want an answer limited to the agreement's text, so that outside facts are not presented as terms of my lease.
26. As a lease signer, I want Blueline to say when the agreement does not answer my question, so that I can seek the missing information elsewhere.
27. As a lease signer, I want a useful general review before setting personal red lines, so that I can start without completing a preference form.
28. As a lease signer, I want to edit my personal red lines and rerun the review, so that the result can reflect what matters specifically to me.
29. As a lease signer, I want preference matches separate from general risk flags, so that my needs do not distort the severity others would see.
30. As a lease signer, I want a proposed edit for each risk flag, so that I have a concrete starting point if I choose to negotiate.
31. As a lease signer, I want to read a flag's explanation before opening its proposed edit, so that I understand the problem before considering a response.
32. As a lease signer, I want a proposed edit aimed at a plausible compromise, so that it is usable in a real conversation with a landlord.
33. As a lease signer, I want to see any risk that would remain if the proposed edit were accepted, so that a compromise is not mistaken for full protection.
34. As a lease signer, I want access to my reviews tied to my authenticated account, so that another signer cannot read my lease text.
35. As a lease signer, I want an automatic review to remain available for 30 days, so that I can return to it during the signing decision.
36. As a lease signer, I want to explicitly save a review for 90 days from that save, so that I can revisit it longer without assuming it lasts forever.
37. As a lease signer, I want the expiry date visible in the library, so that I know when my review will disappear.
38. As a lease signer, I want an expired review and its extracted lease text deleted, so that the library does not quietly become a permanent archive.
39. As an independent evaluator, I want to compare Blueline's flags with adjudicated high-severity terms in held-out lease packets, so that missed serious harm is visible before expansion.
40. As an independent evaluator, I want to verify every flag's exact source sentence against the supplied text, so that an unsupported citation fails rather than merely lowering a score.
41. As an independent evaluator, I want harmless oddities, clean leases, and incomplete packets in the corpus, so that false alarms, invented problems, and improper partial reviews are measured.
42. As an independent evaluator, I want to count plausible warnings later judged harmless separately from unsupported claims, so that the chosen preference for recall does not hide its cost.

## Implementation Decisions

- A public, unauthenticated landing page is the product's front door. It states the product's capabilities (summary, cited risk flags, coverage checklist, document-grounded Q&A, counter-offers, personal red lines, saved library) and voice per BRAND.md, and its call to action is to sign in. It makes no legal-validity, safe-to-sign, or outcome claim, and includes no invented testimonial, statistic, or case study — consistent with the product's evidence-on-hand constraints. It states the product is free to use for this version without implying that stays true later.
- Analysis accepts anonymous pasted text and selectable-text PDFs whether or not Supabase is configured. Anonymous reviews are ephemeral and never persisted. Only the library and personal red lines require an account. Signed-in reviews are scoped to their authenticated owner. This supersedes the former sign-in-before-analysis requirement per the 2026-09-22 build instructions.
- The product is a Next.js web app deployed on Vercel, with Supabase authentication and PostgreSQL persistence. Model calls go through OpenRouter from a server route; the chosen model is read from one environment variable rather than hardcoded.
- The browser accepts pasted text and extracts text from selectable-text PDFs. It preserves document identity and enough sentence location information to verify a flag against the extracted text. Original files are not stored; only extracted text is retained.
- A complete agreement includes every document referenced by the lease. Completeness is checked before general review. A missing referenced document produces a blocking result naming the missing material, not a partial summary or partial flag set.
- The general review returns distinct result categories: summary, ranked risk flags, and not-found items from the published coverage checklist. A risk flag has severity, a concrete consequence, a triggering condition where uncertainty matters, the exact source sentence and source document, and a proposed edit with residual risk. Not-found items and preference matches are not risk flags.
- Before a risk flag is shown, its quoted sentence must match the extracted text of the identified source document verbatim. Invalid flags are retried or dropped; they are never displayed without a source. Severity is based on plausible consequence, not rarity or a model judgment about legal validity.
- The coverage checklist is fixed and published. Its initial topics are deposit deductions and return, early-exit costs, rent changes, repairs, access to the home, and dispute routes. Absence means the term was not located in the complete agreement, not that the agreement is unlawful.
- Document-grounded question answering uses the same complete agreement. If text does not support an answer, the response says so. It does not supply an outside legal rule as if it were a term of the lease.
- A general review comes before personalization. Editing personal red lines reruns analysis and produces separate preference matches without changing general risk severity.
- Each risk flag has a plausible counter-offer. Its proposed edit is revealed only after the signer opens the explanation, and any residual risk remains visible.
- Completed reviews and extracted text are associated with the authenticated signer. Automatic reviews expire 30 days after completion; an explicitly saved review expires 90 days after the save. Expiry removes the review and stored extracted text and is displayed to the signer.
- The user-facing flow and the analysis contract form one high-level acceptance seam: a complete packet moves through completeness gating, review, optional personalization and Q&A, and retention. Tests can control the external model's response and time while observing the same signer-visible flow. Live model evals use that flow with the real provider.

## Testing Decisions

- Test externally visible behavior through the complete signer flow, rather than testing prompt fragments or private helper functions as substitutes for product behavior. The same seam covers both deterministic application tests and live model evals.
- For repeatable application tests, control the external model response and the clock. Exercise pasted text, selectable-text PDF, scanned or textless PDF rejection, multiple referenced documents, and a missing document that blocks review. Verify that original file bytes are never persisted.
- Exercise high and medium deposit, early-exit, and dispute-rights examples; a material clause outside those categories; harmless odd wording; and a clean agreement. Assert exact quotation against the identified extracted document, correct result category, and no safe-to-sign or legal-validity verdict.
- Exercise the published checklist with present and absent topics, document-grounded questions that are answerable and unanswerable, a red-line rerun that changes preference matches without changing general severity, and a counter-offer with visible residual risk.
- Exercise authentication boundaries, automatic and explicit-save expiry, and deletion of expired review text from persistence. Assert the displayed expiry matches the stored lifecycle.
- For model quality, independently adjudicate a held-out corpus before viewing Blueline output. Include serious terms, clean leases, harmless oddities, and incomplete packets. Expansion requires verifiable source sentences for every flag and no missed adjudicated high-severity term in that corpus; count plausible false alarms separately from unsupported claims.
- For the landing page, an independent reviewer checks its copy against the product's actual capabilities and evidence base: no legal-validity, safe-to-sign, or outcome claim, and no invented testimonial, statistic, or case study.
- The application and Vitest full-flow suite now exist. Extend their external model-client, authentication/persistence and clock boundaries.

## Out of Scope

- Review of Terms of Service, subscriptions, freelance contracts, or employment agreements in this first version.
- Post-signing dispute assistance, general contract education, legal enforceability determinations, and safe-to-sign verdicts.
- OCR, scanned PDFs, and DOCX upload.
- Partial analysis of an incomplete agreement.
- Payments, billing, sharing a document between users, or a permanent archive.
- Model-generated coverage expectations, uncited risk flags, or automatic escalation of general severity from personal red lines.

## Further Notes

- This spec synthesizes the first-version brief, the domain glossary, and accepted architectural and product decisions. The research documents support the pain direction but do not establish prevalence, willingness to pay for the product, landlord acceptance of proposed edits, or actual model accuracy.
- The specific OpenRouter model remains a configuration decision. The existence of a Supabase project is not established; implementation must not substitute a throwaway project or mock authentication if credentials are missing.
- The single full-flow test seam is confirmed. The spec is ready to split into implementation work. Independent trust evidence, rather than satisfaction or willingness-to-pay alone, gates expansion beyond lease signers.
