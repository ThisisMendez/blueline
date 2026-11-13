# Beta claims

What the public site may say about Blueline Redline during the beta, the evidence behind each claim, and what it must not say. Audited against the beta refresh candidate on 2026-11-13. When the code or the evals change, re-check this list before changing copy.

## Claims the site may make

| Claim | Evidence |
| --- | --- |
| Every flag quotes the exact words from your documents. A flag whose quote we can't find in your text isn't shown. | `src/features/analysis/verify.ts` (`verifyFlags`, the sentence is cut from the extracted text at stored offsets), `verify.test.ts`, ADR 0001 |
| If the lease requires a document you haven't added, we stop and name what's missing instead of reviewing part of it. | `src/features/analysis/server/route.ts` (completeness runs first, `blocked` has no review), `src/features/packet/completeness.ts`, ADR 0005 |
| We only review residential leases. | `route.ts` (`out-of-scope`), `completeness-prompt.ts`, ADR 0014 |
| You pick your side, renter or landlord, and the flags are judged for that side. | `route.ts` (`role` is required), `prompt.ts`, `src/features/review/review-role-flow.test.tsx`, ADR 0015 |
| We flag terms that could cost you money, change what you have to do, or limit your options. | `prompt.ts` rule 2 and rule 5, PRD.md "Materiality" |
| Each flag has a severity: high, medium or low. | `types.ts` `Severity`, ADR 0003 |
| We check six common lease topics and tell you which ones we found and which we didn't. | `src/features/analysis/checklist.ts`, `coverage.ts`, ADR 0007, ADR 0008 |
| A short list of verified findings can provide an editable message for renters or proposed wording for landlords. | `src/features/negotiation/`, `review-result-flow.test.tsx` |
| Each flag comes with a suggested edit you could propose. | `prompt.ts` (`counterOffer`), `consistency.ts`, ADR 0010, ADR 0013 |
| Your PDF is read in your browser. The file itself never reaches our server. | `src/features/packet/extract/pdf.ts`, `DocumentIntake.tsx` (`readFile` sends only text), `route.ts` (`analysisRequestSchema` is strict and has no file field) |
| We don't save reviews you run without an account. | `route.ts` (persists only when `accounts.kind === "signed-in"`) |
| We don't check your lease against local law, and we never tell you a lease is safe to sign. | `prompt.ts` rule 3, `legal-claims.ts` (`enforceLegalBoundary`), ADR 0014 |
| The Lease Risk Score is worked out by a fixed rule from the verified flags, the same rule for both sides. | `src/features/score/score.ts`, `score.test.ts`, [scoring.md](scoring.md), ADR 0016 |
| Free to use during the beta. | BRAND.md (landing page CTA). No billing code exists |

May make only after the retention deployment gate in README.md passes on the production Supabase project (two-account RLS, cron-driven deletion):

| Claim | Evidence |
| --- | --- |
| Saved reviews are deleted after 30 days, or 90 days after you save one. | `supabase/migrations/0005_review_retention.sql`, ADR 0011, BUILD-REPORT.md (hosted DB, RLS and cron unverified) |

## Claims the site must not make

- **"Every clause is checked" or "a full clause-by-clause review".** The prompt asks for terms with a material downside only and an empty list when there are none (`prompt.ts` rules 2, 4 and 5). A clause without a flag has not been cleared. The clean result says "No material flags found in the text reviewed" (`CLEAN_REVIEW_STATEMENT`) and nothing more.
- **"Several AI models check each other", "parallel analysis" or similar.** Every model call runs one after another, against one configured model. See the data path below.
- **Accuracy, recall or "catches X% of risks", for either role.** The only numbers come from a synthetic gold set written by a model, which contains no leases, run for the renter role only (`evals/REPORT.md`). PRD.md calls them "an upper bound, never a promise to a reader".
- **"Independently validated", "reviewed by lawyers" or "tested on real leases".** Nothing has been labelled by people. The five-lease holdout is locked but unlabelled and has never been run (`evals/holdout/README.md`). The owner hasn't confirmed the lock (`lock.json` `ownerConfirmed: false`). The judge batch has no human verdicts (`evals/judge/README.md`). Such a claim needs two people to label the holdout separately, before seeing output, with differences adjudicated, labels frozen, and frozen results scored for both roles.
- **Anything about landlord accuracy.** Landlord reviews have deterministic flow tests on fixture output (`tests/support/role-fixture-model.ts`) and no eval run at all. ADR 0015: held-out evals must cover both roles before either is called reliable.
- **A score that means safe to sign, a good or bad lease, legal or illegal terms, a probability of harm, or that all risks were found.** ADR 0016, ADR 0014.
- **"Your lease never leaves your device", "private" or "we never store your lease".** The extracted text goes to OpenRouter and a model provider on every review, and signed-in reviews store the extracted text.
- **Anything about how long OpenRouter or the model provider keep data, or that they don't train on it.** The code requests no retention setting (see below), and nobody has checked the account settings or provider terms.
- **Legal advice, attorney review, testimonials, user counts or case studies.** None exist (BRAND.md, PRD.md).
- **Scanned PDFs, photos or Word files.** The review screen accepts PDFs with selectable text (ADR 0006, `pdf.ts`).

## AI provider data path

Traced from the code. Use these facts for the notice shown before a review is sent.

1. **In the browser.** A PDF is parsed with pdf.js (`extractPdfText`). Only its text is kept. The app generates a lease title from a recognized heading or readable filename, with a generic fallback (`title.ts`). A supporting document uses a readable filename or a generic attachment label. Reviewers can rename saved reviews in their library.
2. **To Blueline's server.** `POST /api/analysis` carries `role`, `text`, an optional `title`, up to 11 `referenced` documents as `{ text, title }`, and the signer's `resolutions` (which supplied document answers which reference). No file bytes and no account details are in the body.
3. **To OpenRouter.** `src/features/analysis/model/openrouter.ts` posts to `https://openrouter.ai/api/v1/chat/completions` with:
   - headers: the server's API key, `X-OpenRouter-Title: Blueline Redline`, and `HTTP-Referer` set to `NEXT_PUBLIC_SITE_URL` when set. No user id, email or IP field is added by Blueline.
   - body: a fixed system prompt, a user message, a strict JSON schema, `temperature: 0`, `reasoning: { effort: "low" }`, model from `OPENROUTER_MODEL`, and `provider: { only: [OPENROUTER_PROVIDER or "fireworks"], allow_fallbacks: false, require_parameters: true }`.
   - **No `data_collection: "deny"`, no zero-data-retention flag and no other retention setting is sent.** Retention depends on the OpenRouter account's privacy settings and the provider's terms, which this audit could not see.
4. **What each call contains.** Every document goes in full as `=== DOCUMENT id=… title="…" ===` blocks (`src/features/packet/render.ts`), so document text and titles reach the provider.
   - Completeness check: all documents and titles. No role. The signer's `resolutions` stay on the server.
   - Analysis: the role and all documents. A retry adds the quotes that didn't match.
   - Coverage checklist: all documents.
   - Legal-wording repair, only when generated text states a legal conclusion: the role, the summary, and each affected flag's lease sentences and generated text.
   - Counter-offer consistency check, when there are flags: each flag's lease sentence, suggested edit and residual-risk text.
   - Any call whose reply has the wrong shape is sent once more with a note about the problem.
   - Follow-up questions (`/api/questions`) send the question, the role and all documents again. Personal red lines (`/api/red-lines/matches`) send the signer's red-line text, the role and the saved review's documents.
5. **Sequential, not parallel.** There is no `Promise.all` or other concurrent model call in `src/`. One analysis request makes at least three calls in order (completeness, analysis, checklist), a fourth for the consistency check when there are flags, and more for retries or legal-wording repair. All go to the same model and provider.
6. **Stored by Blueline.** Anonymous reviews are not stored. A signed-in review stores the documents' extracted text and titles plus the review (`src/features/library/store.ts`), never the file.

Before publishing the notice, confirm in Vercel which `OPENROUTER_PROVIDER` production uses (Fireworks when unset) and check the OpenRouter account's data settings.

## Approved wording

Copy below has been through the humanizer skill and contains nothing `findLegalClaims` treats as a legal conclusion other than the deliberate local-law boundary.

### What is checked

> We read your lease and the documents it refers to, from PDFs with selectable text. If the lease needs a document you haven't added, we stop and tell you what's missing. For the side you pick, we look for terms that could cost you money, change what you have to do, or limit your options. We only flag terms with a real downside, so many clauses get no comment. We show you the exact words behind each flag. We also check six common lease topics. We don't check your lease against local law.

Changes from the base wording, and why:

- The review screen accepts PDFs with selectable text. Scanned PDFs are refused (`pdf.ts`).
- Added the missing-document stop (ADR 0005).
- Added "For the side you pick" (ADR 0015).
- Added "We only flag terms with a real downside, so many clauses get no comment", so nobody reads the list as clause-by-clause coverage (`prompt.ts` rules 2 and 4).

### What a score means

> Your score runs from 1 to 100 and sums up the flags we found for your side. A higher score means fewer or less serious concerns. Your most serious flag sets the grade, and the score only counts flags whose exact words we found in your documents. It isn't approval to sign or a legal opinion, it doesn't predict what will happen, and we can miss things. Read the flags before you decide.

The in-product "How we score" note is `HOW_WE_SCORE` in `src/features/score/score.ts`.

### Before you send (draft notice, pending the two confirmations above)

> To run the review, we send the text of your documents and their names to OpenRouter, which passes it to the AI provider that runs the model. Your original file stays on your device. We don't control how long OpenRouter or the provider keep what we send. If you're not signed in, we don't save anything.
