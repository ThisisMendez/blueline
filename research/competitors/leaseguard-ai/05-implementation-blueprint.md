# Implementation blueprint: 12 LeaseGuard-equivalent features for Blue Line

Status: **design only. No code has been written.** Each feature still needs its own ticket in `.scratch/lease-review/issues/` before work starts (CLAUDE.md, "Scope"). All copy a user will read goes through the humanizer skill before it is committed.

Nothing here describes LeaseGuard's backend. "Observed" means rendered output that REA captured, almost all of it from the fictional sample report. Every architecture, algorithm, prompt and schema below is Blue Line's own design, built on the code as it stands at `main` `d0f198c`.

---

## Decisions (owner, 2026-11-12)

| Gate | Decision | Changes to the plan below |
|---|---|---|
| G1 | **Build the A–F risk grade** | Labels are risk levels ("Low risk" … "High risk"), never "safe to sign" or "good/bad lease". Computed deterministically, as in feature 1. Add an ADR. |
| G2 | **Checked statute list, built last** | Feature 4 as designed: titles and official links only, curated by hand, no model-written law. A narrow Layer 2 ADR supersedes part of ADR 0014. |
| G3 | **Fee list, no judgments** | Feature 3 as designed. |
| G4 | **Homes for a single signer** | Feature 10 as designed. No landlord features. |
| G5 | **Deferred** | Co-signers share the print report (feature 8). Feature 11 stays designed but unscheduled. |
| G6 | **Deferred** | Feature 12 stays designed but unscheduled. |

**Build order after these decisions:**
1. Severity display (7), flag titles and readability (5), clause map (2), negotiation email (6)
2. Print report (8), risk grade (1), fee list (3)
3. Homes (10), then comparison (9)
4. Statute list (4)

Sharing (11) and the move-in record (12) are parked.

## 0. Read this first: six features need a settled decision reopened

You've decided to build all 12. Six of them, as LeaseGuard ships them, conflict with rules that CLAUDE.md marks "Settled. Do not reopen" or with an accepted ADR. I haven't reopened those rules, and I haven't dropped the features. Each one below has a design that fits the current rules, plus a note on what changes if you reverse the rule. These are your decisions, and they are also parked in `QUESTIONS.md`.

| Gate | Feature | Conflicts with | Version that fits the current rules | What reversing the rule would allow |
|---|---|---|---|---|
| **G1** | 1 Health Score A–F | CLAUDE.md "No safe-to-sign claims"; ADR 0004 clean-review wording; ADR 0014 "does not … say a lease is safe to sign" | A deterministic **findings grade** computed only from verified flags, labelled as what the review found. An "A" means "no material flags found in the text reviewed", never "safe to sign". | LeaseGuard-style verdict labels ("Sign with confidence", "We recommend not signing"). **Not recommended.** It is the exact claim the product exists to avoid. |
| **G2** | 4 State legal references | ADR 0014 (Layer 2 "is not built or offered now"); CLAUDE.md "State only what the document says" | A **reference panel**: state statute citations and official-source links for each checklist topic, shown beside the review and never inside a flag. Every flag stays lease-only. | Flags that say a clause "may conflict with" state law. That needs ADR 0014 superseded by a Layer 2 ADR with its own sources, validation and eval. |
| **G3** | 3 Junk fees | ADR 0014 decision "Ordinary payments don't produce risk flags on their own" | A **fee inventory** of every cited money term, which is not a flag list. A fee becomes a risk flag only through ordinary flag rules: a material downside stated in the lease (charged "regardless of condition", non-refundable on top of a deposit, uncapped). | Benchmarking against state caps needs G2's reversal. Benchmarking against "market norms" needs a market dataset that doesn't exist. |
| **G4** | 10 Multi-property dashboard | ADR 0012 if it serves landlords or property managers | A dashboard for **one lease signer** comparing the leases they are deciding between, or several homes they rent. | Landlord or manager portfolios. That's an audience expansion, so ADR 0012 asks for independent trust evidence first. |
| **G5** | 11 Co-tenant sharing | ADR 0011 retention, and the privacy model behind RLS (every table is owner-only) | Read-only sharing with **co-signers of the same lease**, invite by email, expiring no later than the review itself, revocable. | Nothing to reverse. This needs a new ADR, not a reversal. |
| **G6** | 12 Deposit Shield | ADR 0002 (first version is for the pre-signing decision; "offers little to … people seeking help after a dispute"); CLAUDE.md "Only the extracted text is stored, never the original file" (photos are files); ADR 0012 | **Text-only move-in record**, offered after a review: a room-by-room condition checklist seeded from the lease's own deposit and move-out clauses, plus a dated communication log. No photos. | Photo evidence, which needs the no-files rule changed and a storage bucket, and post-signing dispute support, which needs ADR 0002 and 0012 revisited. |

The other six features (2, 5, 6, 7, 8, 9) fit the current rules as designed.

---

## 1. Blue Line today (read-only survey)

| Area | What exists | Where |
|---|---|---|
| Intake | Paste text or selectable-text PDF, parsed in the browser with `pdfjs-dist`; packets of up to 12 documents; completeness gate | `src/features/packet/*`, `DocumentIntake.tsx` |
| Review pipeline | Structured OpenRouter call → verbatim citation check with offsets → one retry → ranking → coverage checklist (6 topics) → counter-offer and residual-risk consistency check (ADR 0013) → legal-claim check and repair (ADR 0014) | `src/features/analysis/review.ts`, `verify.ts`, `coverage.ts`, `consistency.ts`, `legal-claims.ts` |
| Flag model | `RiskFlag { severity, consequence, triggeringCondition, counterOffer, residualRisk, sourceSentence, sourceDocumentId, sourceStart, sourceEnd }` | `src/features/analysis/types.ts` |
| Severity | `high`/`medium`/`low` by consequence (ADR 0003); `rankFlags` | `types.ts` |
| Not-found items | Fixed 6-topic checklist: deposit, early exit, rent changes, repairs, access, dispute routes | `checklist.ts` |
| Red lines | Personal preference matches, kept separate from flags | `src/features/red-lines/*` |
| Q&A | Answers grounded in the document | `src/features/questions/*` |
| Library | Supabase `reviews`, `review_documents`, `review_flags`, `review_checklist_topics`, `signer_red_lines`; owner-only RLS; 30/90-day expiry via `pg_cron` | `supabase/migrations/0001–0006`, `src/features/library/*` |
| Model | `ModelClient` port, `completeStructured` (JSON Schema request + zod check + one retry), model id from `OPENROUTER_MODEL` | `src/features/analysis/model/*` |
| Evals | Gold set, holdout, judge, independent corpus | `evals/`, `npm run eval*` |
| Dependencies | next, react, @supabase/*, pdfjs-dist, zod. No PDF writer, diff library, email or payments. | `package.json` |

**Already covered:** most of 2 (cited flags), 5 (consequence and trigger in plain English), 6 (per-flag counter-offers, ADR 0010) and 7 (severity ranking, ADR 0003). For those, the work is to extend what exists, not rebuild it.

---

## 2. Cross-cutting architecture

```
Browser (Next 16 app router)                 Server routes (Node runtime)                     Supabase
───────────────────────────                  ─────────────────────────────                    ─────────
DocumentIntake ─ pdfjs text ─▶ POST /api/analysis ─▶ runGeneralReview ─────────────────▶ reviews, review_flags …
ReviewResult                                    │  ├─ verifyFlags (offsets)                      (owner RLS + new share RLS)
 ├─ FindingsGrade (1)    ◀── pure fn ───────────┤  ├─ coverage
 ├─ ClauseMap (2)        ◀── segmentClauses ────┤  ├─ NEW fee inventory pass (3)        ──▶ review_fees
 ├─ FeeInventory (3)                            │  ├─ consistency / legal-claims
 ├─ ReferencePanel (4)   ◀── GET /api/references?state&topics ─▶ statute_references (global, read-only)
 ├─ RiskFlagCard (5,7)                          │
 ├─ NegotiationDraft (6) ◀── pure assembly (+ optional model polish → legal-claims check)
 ├─ Print / PDF (8)      ── /review/[id]/print (server-rendered, print CSS)
Compare (9)  ─────────────▶ POST /api/comparisons ─▶ runGeneralReview(revised) + alignFlags ─▶ review_comparisons
Library → Dashboard (10) ─▶ properties, reviews.property_id
Share (11) ───────────────▶ POST /api/shares, /share/accept ─────────────────────────────────▶ review_shares (+RLS)
Move-in record (12) ──────▶ /api/move-in/* ─────────────────────────────────────────────────▶ move_in_records, entries
```

**Rules every feature inherits:**
1. **The citation rule.** Anything shown as coming from the lease carries `sourceDocumentId`, `sourceStart` and `sourceEnd`, and passes `verify.ts`. That covers fees, clause rows and comparison rows.
2. **The legal boundary.** Generated text runs through `enforceLegalBoundary` / `findLegalClaims` before it's returned. Statute content (feature 4) is curated data, never model output.
3. **Deterministic first.** The grade, clause splitting, fee parsing, alignment, email assembly and PDF are pure functions with unit tests. The model is used only where language understanding is required.
4. **One model id.** All calls go through `ModelClient` with `OPENROUTER_MODEL`. Nothing is hardcoded.
5. **Retention.** Every new table cascades from `reviews` and expires with it (ADR 0011), unless a feature's own ADR says otherwise (feature 12).
6. **Feature folders.** Each feature lives in `src/features/<feature>/` (CLAUDE.md layout). `src/shared/` is created only when two features truly share code.

---

## 3. The 12 features

Each feature has the same seven parts: (1) observed behaviour, (2) evidence and what is assumed, (3) architecture, (4) algorithms, rules, prompts and schemas, (5) how it fits Blue Line, (6) dependencies and tests, (7) edge cases.

### Feature 1: Findings grade (Lease Health Score equivalent) — gate G1

**1. Observed.** A gauge with a letter and a number (`C 62/100`), a headline sentence and per-severity counts. It's free. Published scale: A "Safe to sign" through F "Predatory. We recommend not signing as-is."

**2. Evidence.** `sample-report` Evidence and `screenshots/sample-report.png`; home page scale text. How-it-works says "Risk scoring per clause (0–100)" and "Aggregated Lease Health Score calculation". *Assumed:* the formula. One sample (1 high, 4 medium, 3 low → 62) can't establish it.

**3. Architecture.**
- **Frontend:** a `FindingsGrade` component at the top of `ReviewResult`, above the flags.
- **Backend:** none. It's a pure function over `GeneralReview`, computed at render and on read, so it's never stored and never drifts from the flags it summarises.
- **API, database and AI:** none.

**4. Algorithm.** It's deterministic and explainable, so the signer can see why they got a letter.
```ts
// src/features/grade/grade.ts
type Grade = "A" | "B" | "C" | "D" | "F";
interface FindingsGrade { grade: Grade; counts: Record<Severity, number>; basis: string /* fixed, humanized copy */ }
function gradeReview(r: GeneralReview): FindingsGrade {
  const c = countBySeverity(r.riskFlags);            // verified flags only
  const withheld = r.legalClaims?.withheld ?? 0;     // withheld text never lowers or raises the grade, but is disclosed
  if (c.high >= 2) return g("F");
  if (c.high === 1) return g("D");
  if (c.medium >= 3) return g("C");
  if (c.medium >= 1 || c.low >= 3) return g("B");
  return g("A");                                      // A ⇔ r.clean || only ≤2 low flags
}
```
- **Rules:** thresholds are counts of consequence-ranked flags (ADR 0003), never rarity or legal validity.
- **Fixed label set:** A "No material flags found in the text reviewed" (the `CLEAN_REVIEW_STATEMENT` wording) … F "Two or more high-severity flags found". No verdict words are allowed. `findLegalClaims` should also reject "safe", "sign with confidence" and "do not sign" in this copy, enforced by a test.
- **No 0–100 number.** A number would imply precision the pipeline doesn't have. If you want one, use `100 − 30·high − 10·medium − 3·low`, floored at 0, and label it a count-based index.
- **Incomplete or blocked packets get no grade.** `status !== "reviewed"` renders nothing.

**5. Integration.** Reads `GeneralReview.riskFlags` and `clean`. The library line (`StoredReviewSummary`) gains `grade` for feature 10.

**6. Dependencies and tests.** No new dependency.
- Unit tests: every boundary (0/1/2 high, 0/2/3 medium, 3 low); grade is A when and only when there are no high or medium flags and at most 2 low; no grade on blocked, out-of-scope or unverified results.
- Copy test: every label passes `findLegalClaims` and a verdict-word list.
- Component test with the existing review fixtures.

**7. Edge cases.**
- Dropped flags (`droppedFlagCount > 0`) mean the grade may understate. Say so next to the grade.
- Withheld explanations: the flag still counts, so the grade is unaffected.
- A signer may read "A" as "safe". The comprehension test from ADR 0014 should include the grade.
- Grade-gaming: future threshold changes must be versioned (`gradeVersion`) so stored reviews don't change letters silently.

---

### Feature 2: Clause-by-clause review

**1. Observed.** "26 clauses reviewed · 8 issues found", with one card per flagged clause showing badge, title, quote, why it matters, recommended action and a statute chip.

**2. Evidence.** `sample-report` Evidence. *Assumed:* how they split clauses, and whether their quotes are checked against the upload.

**3. Architecture.**
- **Frontend:** a `ClauseMap` view, a collapsible list of every clause in document order. Each row shows the clause's first words and its status: `flagged (severity)`, `checklist topic: <topic>`, `preference match` or `no finding`. Clicking a row jumps to its flag card or shows the clause text.
- **Backend:** a deterministic `segmentClauses(document)` in `src/features/clauses/segment.ts`. No model call. Statuses come from offset overlap with existing flags, coverage topics and red-line matches.
- **Database:** none at first. Clauses are recomputed from stored `extracted_text`, which is deterministic.
- **AI:** optional later. Run a per-clause pass only for clauses the main pass didn't touch, asking "does this clause have a material downside not already flagged?", through the same verification. Defer until evals show a recall gap.

**4. Algorithm.**
```ts
interface Clause { documentId: string; index: number; start: number; end: number; heading: string | null }
// 1. Split on numbered headings: /^\s*(?:section|article|§)?\s*\d+(?:\.\d+)*[.)]?\s+/im and ALL-CAPS heading lines.
// 2. If fewer than 3 headings found, fall back to paragraph breaks (blank line), then sentences (reuse normalize.ts offsets).
// 3. Merge fragments < 40 chars into the next clause; split clauses > 2,000 chars at sentence boundaries.
// 4. Status = first match by priority: flag (highest severity among overlapping flags) > preference match > coverage topic > none.
```
- **Business rules:** "no finding" is shown as "No material flag found in this clause", never "safe" or "OK". The count line reads "N clauses read · M flagged".

**5. Integration.** Uses `ExtractedDocument.text`, the `RiskFlag` and `FoundTopic` offsets, and red-line matches. It adds no model cost.

**6. Dependencies and tests.** No new dependency.
- Unit tests: numbered, unnumbered and mixed leases from `tests/fixtures`; offsets round-trip (`text.slice(start, end)`); every flag maps to exactly one or more clauses; segmentation is stable across runs.
- Component test: clicking a flagged row focuses its card.

**7. Edge cases.**
- PDFs with lost line breaks give one giant clause; the fallback path handles this.
- A flag sentence can straddle two clauses; it attaches to both.
- Packets: clauses are per document, and addenda are listed separately.
- "No finding" on a clause the model simply missed. The ADR 0004 calibration risk is disclosed in the existing footer copy.

---

### Feature 3: Fee inventory and fee flags (junk fee detection) — gate G3

**1. Observed.** Advertised as a "Junk Fee Scanner" covering admin, amenity, duplicate move-out, utility markup, stacked pet and late fees. One sample flag: "Mandatory Carpet-Cleaning Fee Regardless of Condition" (LOW).

**2. Evidence.** Features page text; sample report locked flag. *Assumed:* state-cap and "market norm" benchmarking. No data is visible.

**3. Architecture.**
- **Frontend:** a `FeeInventory` table under the summary with columns for name, amount, when it's charged, refundable, and the cited sentence. A fee row links to its risk flag if the flag pipeline raised one.
- **Backend:** a new pass `runFeeInventory(packet, model)` in `src/features/fees/`, run after coverage. It makes one structured call, then verifies each fee's sentence with `verifyFlags`-style offset checks, then parses amounts deterministically.
- **Database:** a `review_fees` table (below).
- **AI:** extraction only. The model lists money terms; it doesn't judge them. Judging stays in the main flag prompt, where ADR 0003 severity rules already apply.

**4. Schema and prompt.**
```ts
// model output (JSON Schema + zod, schema name "blueline_fee_inventory")
{ fees: Array<{
  label: string;                         // the lease's own name for the charge
  sourceDocumentId: string;
  sourceSentence: string;                // verbatim, verified to offsets
  amountText: string;                    // verbatim money expression, e.g. "$150", "25% of monthly rent"
  basis: "fixed" | "percent-of-rent" | "per-day" | "per-month" | "actual-cost" | "unstated";
  timing: "application" | "move-in" | "monthly" | "on-event" | "move-out" | "unstated";
  condition: string | null;              // verbatim trigger, e.g. "if rent is not received by the 2nd"
  refundable: "yes" | "no" | "unstated";
}> }
```
- **System prompt (outline):** "List every charge, fee, deposit or penalty the documents require the signer to pay, other than base rent. Copy the sentence exactly. Copy the amount exactly as written. Don't judge whether a fee is fair, legal, common or excessive. If the amount isn't stated, use `unstated`." This passes through `legal-claims` like everything else.
- **Deterministic parsing:** `parseAmount(amountText, monthlyRent?)` → `{cents?: number, percent?: number}`. Monthly rent comes from a verified "rent" fee row or stays unknown.
- **Fee-flag rules.** These are added to `prompt.ts` guidance; they are not new code-side flags. A money term becomes a risk flag only if the lease text creates a downside beyond an ordinary payment (ADR 0014):
  - it's charged regardless of condition or use
  - it's non-refundable and duplicates a refundable deposit's stated purpose
  - it compounds per day with no cap
  - it's triggered by a landlord-determined event with no stated limit
  - it's an amount the landlord may change one-sidedly (this ties to ticket 18)
- **Database:**
```sql
create table public.review_fees (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position int not null, label text not null, amount_text text not null,
  amount_cents int, amount_percent numeric, basis text not null, timing text not null,
  refundable text not null check (refundable in ('yes','no','unstated')),
  condition text, source_document_id text not null,
  source_start int not null check (source_start >= 0), source_end int not null check (source_end > source_start),
  linked_flag_rank int
);
-- owner-only RLS (copy 0001 policies) + share policy from feature 11
```

**5. Integration.**
- Adds one model call per review; `review.ts` orchestration gets a fourth step.
- `GeneralReview.fees?: readonly Fee[]` sits beside `coverage`, as a separate category per the existing comment in `types.ts`.
- Fees with an unverified citation are dropped and counted (`droppedFeeCount`), the same as flags.

**6. Dependencies and tests.** No new dependency.
- Unit tests: `parseAmount` covering "$1,250.00", "25% of monthly rent", "$10 per day", "one month's rent" (→ unparsed, shown as text), and "N/A".
- Verification tests: a fee whose sentence isn't in the text is dropped.
- Eval: add fee-heavy fixtures to the gold set covering recall of money terms and no "excessive" or "illegal" language.
- A test that an ordinary fee ("$50 application fee") yields an inventory row and **no** flag.

**7. Edge cases.**
- Fees live in a separate fee schedule; packet completeness (ADR 0005) already requires it.
- Ranges ("$100–$300") and formulas ("greater of $50 or 5%") stay as text, with a partial parse.
- Currency other than USD stays as text.
- A long fee schedule could exceed the output budget. Chunk by document and merge.

---

### Feature 4: State references panel — gate G2

**1. Observed.**
- **Input:** a required state dropdown on `/analyze`.
- **Output:** statute chips on flags (e.g. `F.S. 83.49(3)`), a `MAY NOT BE ENFORCEABLE` badge, and a free "Key Tenant Rights" box (deposit limit, notice period).
- **SEO:** 50 `/tenant-rights/<state>` guides.

**2. Evidence.** `analyze` and `sample-report` Evidence; how-it-works "updated quarterly". *Not verified:* any legal statement. The flag-level statute claims are exactly what ADR 0014 forbids for Blue Line now.

**3. Architecture (the version that fits the current rules).**
- **Frontend:**
  - an optional "Where is the home?" state select in `DocumentIntake`, stored on the review
  - a `ReferencePanel` below the flags titled along the lines of "Where to read your state's rules", listing the checklist topics that appear in this lease and, for each one, the state's statute citation and an official link
  - no text that compares the lease to the statute
- **Backend:** `GET /api/references?state=FL&topics=deposit-deductions-and-return,access-to-the-home` reads curated rows.
- **Database:** a global table `statute_references` (read-only to users; written only by migration or seed after human review).
- **AI:** **none.** Statute text and citations are curated data. The model never generates or paraphrases law, which keeps the ADR 0014 boundary whole.

**4. Schema and rules.**
```sql
create table public.statute_references (
  id uuid primary key default gen_random_uuid(),
  state_code char(2) not null,                         -- USPS code
  topic_id text not null,                              -- ChecklistTopicId
  citation text not null,                              -- e.g. "Fla. Stat. § 83.49"
  title text not null,                                 -- official section title, verbatim
  official_url text not null check (official_url like 'https://%'),
  source_retrieved_at date not null,
  reviewed_by text not null, reviewed_at date not null,
  data_version int not null,
  unique (state_code, topic_id, citation, data_version)
);
alter table public.statute_references enable row level security;
create policy "Anyone signed in can read references" on public.statute_references for select to authenticated using (true);
-- reviews: add column state_code char(2) null
```
- **Rules:**
  - Show the official title and link only. Never summarise what the statute requires. A summary would be a legal claim.
  - Every row needs a named reviewer and date. Rows older than 12 months show "last checked <date>".
  - Without a state, the panel says "Choose a state to see where its rules are published".
- **Data work (the real cost):** 50 states × 6 topics, about 300 rows, each checked by a person against an official legislature site. Start with the states your eval corpus covers.
- **Full G2 reversal, for reference only:** a Layer 2 ADR, statute text ingestion, a separate "comparison" model pass whose claims cite **both** a lease sentence and a statute row, and its own eval set with legal review. This is not designed here because ADR 0014 says it needs its own sources and validation first.

**5. Integration.**
- Topic ids reuse `CHECKLIST_TOPIC_IDS`, so the panel lines up with not-found items.
- The Q&A feature's fixed "law was not checked" note can link to the panel.

**6. Dependencies and tests.** No new dependency. Data entry is a manual process.
- Schema tests: `state_code` is a valid USPS code, the URL is https, the topic id exists.
- A unit test that the panel renders no generated text.
- A test that no flag or summary text includes a citation pattern (`/§|Stat\.|F\.S\./`), enforced in `legal-claims` tests.

**7. Edge cases.**
- Cities with their own ordinances (NYC, Chicago, SF) aren't covered at state level. The panel must say "local rules may also apply".
- Statutes get renumbered; `data_version` plus `source_retrieved_at` handles that.
- Homes in DC or US territories need a decision: include them, or show "not covered".

---

### Feature 5: Plain-English explanations

**1. Observed.** Each card shows: the clause quote, "Why It Matters" (consequence plus statute), "Recommended Action" and a statute chip. Free tier gets "Basic", Pro gets "Full".

**2. Evidence.** `sample-report` and `features` Evidence.

**3. Architecture.** Already mostly built. `RiskFlag.consequence` corresponds to "Why it matters", `triggeringCondition` to "When it would matter", and `counterOffer` to the proposed edit (ADR 0010). Additions:
- **Frontend:** `RiskFlagCard` gets a short **title** line.
- **AI:** add `title` (≤ 8 words, neutral, no legal terms) to `analysisJsonSchema` / `modelFlagSchema`.
- **Backend:** a deterministic readability guard.
- **Database:** `review_flags.title text` (nullable for old reviews).

**4. Rules.**
- `title` must name the lease term, not judge it ("Deposit deductions at landlord's discretion", not "Illegal deposit clause"). It passes `findLegalClaims`.
- **Readability guard:** compute the Flesch–Kincaid grade of `consequence` and `triggeringCondition` with a small pure function (syllable heuristic, no dependency). If it's above grade 9, send it once to the existing legal-repair-style rewrite call with the instruction "Rewrite at about a grade-8 reading level, keep every fact, add nothing", then recheck the legal boundary. If it's still above, keep the original. Never withhold a flag for readability.

**5. Integration.** Schema change in `model/schema.ts`; migration `review_flags add column title text`; `RiskFlagCard` renders `title ?? first words of consequence`.

**6. Dependencies and tests.** No new dependency.
- Unit tests for the readability function against known passages.
- Schema tests (`title` required in new output; old stored reviews still load).
- Eval: the judge rubric adds "title is neutral and names the term".

**7. Edge cases.** Readability scores don't fit legal nouns ("indemnification") well, so allow a glossary of terms that don't count. Each rewrite adds latency; cap it at the flags that fail the guard.

---

### Feature 6: Negotiation email drafts

**1. Observed.**
- **Advertised:** templates for every medium and high flag, email drafts and conversation starters.
- **One full example:** a polite request to remove a $350 admin fee.
- **In the sample:** "Recommended Action" text includes quoted template lines.

**2. Evidence.** `features` Evidence; `sample-report`. Full templates are behind the paywall.

**3. Architecture.**
- **Frontend:** a `NegotiationDraft` panel on the review. The signer ticks which flags to raise (default: high and medium), picks a tone (`plain` or `formal`), and gets one combined email with Copy, `mailto:` and Download .txt buttons. A per-flag "Copy this request" button sits under each flag's existing "See proposed edit" (ADR 0010 order: consequence first, then edit).
- **Backend:** `assembleNegotiationEmail(flags, options)` is a **pure template assembly** from verified fields: cited sentence, counter-offer and section reference if a clause heading exists (feature 2). It makes no model call by default, so it can't introduce new claims.
- **AI (optional):** `POST /api/negotiation/polish` runs one structured call that may reorder or smooth the connecting sentences only. It's checked so that every counter-offer string and quote still appears **verbatim** in the output, then passes `findLegalClaims`. On any failure it falls back to the assembled version.
- **Database:** none. Drafts are generated on demand. The signer's tick choices may sit in `localStorage`.

**4. Template, deterministic.**
```
Subject: Questions about the lease for {property label | "the home"} before I sign

Hi {landlord name | ""},

Thanks for sending the lease. Before I sign, I'd like to discuss {n} terms.

{for each selected flag, in rank order}
{i}. {clause heading or "This term"}: "{sourceSentence}"
   Would you be open to this wording instead: "{counterOffer}"

Happy to talk through any of these. Thanks,
{signer name | ""}
```
- **Rules:**
  - Never mention law, rights or enforceability. Never threaten.
  - Never claim the edit removes the risk; `residualRisk` stays in the review, not in the email.
  - The draft is labelled for the signer as text to edit before sending.
- **Polish prompt (optional):** "Make this email read naturally. Keep every quoted sentence and every proposed wording exactly as written. Don't add facts, rights, laws, deadlines or demands. Return `{subject, body}`." Then the verbatim-inclusion check runs.

**5. Integration.** Uses `RiskFlag.counterOffer` and `sourceSentence`, which already exist and are already checked by ADR 0013 consistency. It reuses `legal-claims`. Humanizer review applies to the fixed template wording.

**6. Dependencies and tests.** No new dependency; `mailto:` and the clipboard API are built in.
- Unit tests: assembly order and numbering; quote escaping; zero selected flags gives no draft; `mailto` URL encoding and length (browsers limit at about 2,000 characters, so fall back to copy only).
- A polish-fallback test where the model drops a counter-offer and the assembled draft is returned.
- A legal-claims test on the fixed template.

**7. Edge cases.**
- Very long quotes: truncate the displayed quote with "…" only in the email, never in the review.
- Withheld counter-offer text (ADR 0014 repair failed): leave that flag out of the email and tell the signer.
- Landlord name: there's no field for it, so leave a placeholder.

---

### Feature 7: Severity prioritization

**1. Observed.**
- High, medium and low badges, sorted high first.
- A count sentence ("1 high-risk, 4 medium-risk, 3 low-risk").
- The free tier shows the top 5.
- Pro advertises "severity scoring per clause", which seems to be the 0–100 scale.

**2. Evidence.** `sample-report`, `analyze` and `pricing` Evidence.

**3. Architecture.** Already built (`Severity`, `SEVERITY_RANK`, `rankFlags`, ADR 0003). Additions are frontend only:
- a severity count line under the grade
- filter chips (All / High / Medium / Low)
- a "Why this severity" disclosure on each card showing `triggeringCondition`

**4. Rules.**
- Keep three categories; **don't add a 0–100 score**. ADR 0003 ranks by consequence, and a number would suggest a precision the evals don't measure.
- Ties sort by document order (as now).
- The count line uses the verified count only, and dropped flags are disclosed separately.

**5. Integration.** `ReviewResult` and `RiskFlagCard` only.

**6. Dependencies and tests.** None to add.
- Component tests: the filter keeps rank order, the counts match the flags, and an empty filter state has its own wording.

**7. Edge cases.** All flags low means the filter defaults to All. Preference matches stay in their own section and aren't counted in severity (ADR 0007).

---

### Feature 8: Downloadable report (PDF)

**1. Observed.** Advertised: "A branded, printable report you can share with your attorney or housing advocate", plus email delivery. Not exercised.

**2. Evidence.** `how-it-works` and `pricing` text only.

**3. Architecture (recommended, no dependency).**
- **Frontend:** a "Download report" button that opens `/review/[reviewId]/print`.
- **Route:** a server-rendered print layout with print CSS (`@media print`, `@page { size: Letter; margin: 0.75in }`), which calls `window.print()` on load. The signer saves it as PDF from the browser dialog. This works in every current browser with no package, and the server never holds a PDF file.
- **Content:** title, date and expiry, grade (1), severity counts (7), the boundary note (ADR 0014 wording), each flag (title, quote, consequence, trigger, proposed edit, residual risk), not-found items, fee inventory (3), references panel (4) when present, and the document list.
- **Backend and database:** read through the existing `findForSigner`, plus the share path from feature 11.
- **Alternative (needs your OK for a dependency):** a server-generated PDF with `@react-pdf/renderer` for a one-click file. Only worth it if testing shows people can't manage print-to-PDF.
- **Email delivery:** **deferred.** It needs an email provider dependency and a decision about sending lease text to a third party. The existing Supabase auth email can't carry it.

**4. Rules.** The print view shows exactly the verified review content. It is never regenerated with the model. Expired reviews return 404. A footer carries the boundary and expiry note.

**5. Integration.** A new route under `src/app/(app)/review/[reviewId]/print/page.tsx` reusing the components with a `variant="print"` prop.

**6. Dependencies and tests.** None for the print route.
- Route tests: an owner gets 200, a non-owner 404 (the same as the review page), and an expired review 404.
- A snapshot of the print markup.
- Manual check: Chrome, Safari and Firefox print-to-PDF at Letter and A4.

**7. Edge cases.** Long quotes that break across pages: use `break-inside: avoid` on cards. Dark mode must not print with a dark background (force light in `@media print`). Mobile Safari's print-to-PDF works through the share sheet, so add a note.

---

### Feature 9: Original vs revised comparison

**1. Observed.** Only the line "Lease comparison (draft vs. revised)" (Pro). No UI was found.

**2. Evidence.** `pricing` Evidence. Everything below is our own design.

**3. Architecture.**
- **Frontend:** in the library, "Compare with a revised version" on a review. Intake is reused for the revised packet. The result has three lists, all cited:
  - **Changed terms:** a sentence-level diff, with the revised wording highlighted
  - **Flags:** resolved, still present, new, and severity changed
  - **Your proposed edits:** for each counter-offer, whether the revised text adopted it (exact or close match) or not
- **Backend:** `POST /api/comparisons {baseReviewId, revisedPacket}` runs the normal `runGeneralReview` on the revised packet (a full review, so every flag is independently verified), then `compareReviews(base, revised)`.
- **Database:** `review_comparisons`.
- **AI:** none beyond the normal review. Matching is deterministic. An optional judge call ("is clause B a revision of clause A?") comes in only if the deterministic alignment proves weak in evals.

**4. Algorithms.**
- **Clause alignment:** segment both versions (feature 2). For each base clause, find the revised clause with the highest token-set Jaccard similarity at or above 0.5, tie-broken by position. Unmatched base clauses are `removed`; unmatched revised clauses are `added`; matched clauses with similarity below 1 are `changed`.
- **Text diff:** a word-level Myers diff written as a pure function (about 80 lines) to avoid a dependency. Alternative: the `diff` package, which needs your OK.
- **Flag mapping:** a base flag is `resolved` if its clause is removed, or changed and no revised flag overlaps the aligned clause. It's `persisting` if a revised flag overlaps the aligned clause (with `severityChanged` if the severity differs). Revised flags that map to no base flag are `new`.
- **Counter-offer adoption:** normalise both with `normalizeText` and `foldPunctuation`. `adopted` if the counter-offer appears in the revised clause; `partly` if token overlap is at least 0.7; otherwise `not adopted`. This is shown as text matching, not as "risk removed" (ADR 0010 and 0013).
```ts
interface ReviewComparison {
  baseReviewId: string; revisedReviewId: string;
  clauses: Array<{ status: "added"|"removed"|"changed"|"same"; base?: ClauseRef; revised?: ClauseRef; diff?: DiffOp[] }>;
  flags: Array<{ status: "resolved"|"persisting"|"new"; base?: RiskFlagRef; revised?: RiskFlagRef; severityChanged?: boolean }>;
  counterOffers: Array<{ baseFlagRank: number; adoption: "adopted"|"partly"|"not-adopted"; revisedClause?: ClauseRef }>;
}
```
```sql
create table public.review_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  base_review_id uuid not null references public.reviews(id) on delete cascade,
  revised_review_id uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now()
);
-- owner RLS; the computed comparison is recomputed on read (pure), so only the pairing is stored.
```
- **Rules:**
  - "Resolved" means "no flag raised on the revised wording". The copy must not say the risk is gone.
  - Comparing across different properties is allowed but warned about when the alignment rate is below 30%.

**5. Integration.** Reuses the whole pipeline, packet intake, `normalize.ts` and the segmentation from feature 2. The revised review is a normal library review, so it expires on its own schedule (ADR 0011). The comparison disappears when either review expires (cascade).

**6. Dependencies and tests.** None, unless you'd rather use the `diff` package.
- Unit tests: the Myers diff against known pairs; alignment on reordered sections; flag mapping on fixture pairs (resolved, persisting, new); adoption at exact, near and none.
- Route tests: owner-only access to both reviews; one expired review gives 404.
- Eval: 5 to 10 real revised-lease pairs in the holdout.

**7. Edge cases.**
- A renumbered whole lease (alignment still works by content).
- A clause split into two (one-to-many: allow the best two matches above 0.4).
- The revised PDF may be scanned with no text layer, which is blocked at intake today (ADR 0006).
- The model may flag the same sentence differently on reruns, giving a spurious "new" or "resolved". Show the cited sentences so the signer can see it.

---

### Feature 10: Multi-lease dashboard — gate G4

**1. Observed.** Pricing only: "Multi-property dashboard" (Premium, "for renters managing multiple properties or high-value leases"). `/account` is a sign-in form.

**2. Evidence.** `pricing` and `account` Evidence.

**3. Architecture (version that fits lease signers).**
- **Frontend:** the library becomes a dashboard. Reviews are grouped by **home**, a signer-named label such as "Oak St apartment" or "Option B – Riverside". Each card shows grade (1), severity counts (7), flag count, expiry, last review, and links to compare (9), print (8) and share (11). A "Compare homes" view puts 2 to 4 homes side by side by checklist topic: found or not found, and flag severity per topic.
- **Backend:** extend `ReviewStore` with `listHomesForSigner` and `assignHome`.
- **Database:** a `homes` table plus `reviews.home_id`.
- **AI:** none.

**4. Schema.**
```sql
create table public.homes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  created_at timestamptz not null default now()
);
alter table public.reviews add column home_id uuid references public.homes(id) on delete set null;
-- owner RLS; no street address column (avoid storing PII beyond what the lease text already holds)
```
- **Rules:**
  - A home with no unexpired reviews is shown as empty and can be deleted.
  - Homes don't extend review retention.
  - The side-by-side view only lines up existing verified data. It never ranks homes "best" or "worst".

**5. Integration.** `LibraryList.tsx`, `summarizeStoredReview` (add `grade` and `homeId`), and the library routes.

**6. Dependencies and tests.** None.
- RLS tests: a signer can't attach a review to another signer's home (add a check through a trigger or a composite FK on `(id, user_id)`).
- Store tests in both `memory-store` and `supabase-store`.
- Component tests for grouping and the empty home.

**7. Edge cases.** Reviews created before homes existed go under "Unsorted". Deleting a home leaves its reviews in place (set null). With 50 or more reviews the list needs pagination. The existing list isn't paginated.

---

### Feature 11: Co-signer sharing — gate G5

**1. Observed.** Pricing only: "Co-tenant access (share reports)" (Premium).

**2. Evidence.** `pricing` Evidence.

**3. Architecture.**
- **Frontend:** a "Share with a co-signer" dialog on a review. The owner enters an email and sees the people it's shared with, their status, and when access ends, with a Revoke button. The invitee gets a sign-in link, and after signing in sees the review read-only with an "Shared by <owner email>" banner.
- **Backend:**
  - `POST /api/shares {reviewId, email}` creates the share and an invite token (hash stored)
  - `GET /share/[token]` accepts it, binding `invitee_user_id` to the signed-in user whose email matches
  - `DELETE /api/shares/[id]` revokes it
  - The invite email comes from Supabase Auth's `inviteUserByEmail` or `signInWithOtp` with a redirect to the accept URL, so no new email dependency is needed. It does count against the auth email rate limit (commit `c61a81d`).
- **Database:** `review_shares` plus **additional SELECT policies** on `reviews`, `review_documents`, `review_flags`, `review_checklist_topics` and `review_fees`.
- **AI:** none.

**4. Schema and RLS.**
```sql
create table public.review_shares (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  invitee_email citext not null,
  invitee_user_id uuid references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  accepted_at timestamptz, revoked_at timestamptz,
  unique (review_id, invitee_email)
);
create function public.can_read_review(r uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.reviews v where v.id = r and v.user_id = (select auth.uid()))
      or exists (select 1 from public.review_shares s where s.review_id = r
                 and s.invitee_user_id = (select auth.uid()) and s.accepted_at is not null and s.revoked_at is null);
$$;
create policy "Co-signers can read shared reviews" on public.reviews for select to authenticated using (public.can_read_review(id));
-- same pattern on child tables using review_id; INSERT/UPDATE/DELETE stay owner-only.
```
- **Rules:**
  - Read-only.
  - Share access ends when the review expires (cascade) or is revoked. It never extends retention.
  - Red lines are **not** shared (they're personal, ADR 0007).
  - Q&A asked by the invitee isn't stored on the owner's review.
  - At most 5 invitees per review.
  - The token is single use and expires after 7 days if not accepted.
  - The email must match the invitee's signed-in account.

**5. Integration.**
- `ReviewStore.findForSigner` becomes `findForReader(readerId, reviewId)` returning `{review, role: "owner" | "co-signer"}`.
- Feature 8's print route and feature 9's comparison accept the co-signer role for reading only.
- The `proxy.ts` session handling is unchanged.

**6. Dependencies and tests.** None. Supabase `citext` may need `create extension citext`, which is a Postgres extension, not an npm package.
- RLS tests against a local Supabase: owner, invitee (accepted, unaccepted, revoked), another user, an expired review, and an invitee trying to write.
- Token tests: reuse, a wrong email, expiry.
- Run `/security-review` on the branch before merging.

**7. Edge cases.**
- The invitee signs in with a different email: show "This invite was sent to another address".
- The owner deletes their account: cascade removes it.
- The invitee may forward or screenshot it. Disclose that sharing reveals the lease text.
- A rate limit on the auth email: show the existing "email limit reached" copy.

---

### Feature 12: Move-in record (Deposit Shield equivalent) — gate G6

**1. Observed.** On LeaseGuard this is **not built** ("coming soon"). FAQ: "document your unit condition at move-in, track landlord communications, and build a record that supports deposit return disputes."

**2. Evidence.** `pricing` HTML (FAQ). Everything below is our own design.

**3. Architecture (version that fits the current rules: text only, offered from a review).**
- **Frontend:** "Start a move-in record" on a reviewed lease. It has three tabs:
  - **What your lease says:** the verified flags and found topics about deposit, cleaning, painting and move-out, cited from the review
  - **Condition checklist:** rooms × items (walls, floors, appliances…), each with a condition (`good`/`worn`/`damaged`/`missing`), a free-text note and a timestamp, and the option to add rooms or items
  - **Communication log:** dated entries (date, channel, summary, who), typed by the signer
  - Export uses feature 8's print route ("Move-in record, created <date>").
- **Backend:** `/api/move-in/*` CRUD routes; `seedChecklistFromLease(review)`, which is deterministic. Rooms come from a fixed default list; extra items come from fee-inventory rows (3) with `timing: "move-out"`, such as carpet or paint.
- **Database:** `move_in_records`, `move_in_items` and `move_in_messages`.
- **AI:** none at first. Optional later: "Suggest checklist items from this lease's move-out clauses", run as a structured call whose items must cite a verified sentence.

**4. Schema.**
```sql
create table public.move_in_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid references public.reviews(id) on delete set null,   -- record outlives the review's lease text
  home_id uuid references public.homes(id) on delete set null,
  move_in_date date, created_at timestamptz not null default now(),
  expires_at timestamptz not null                                     -- needs its own retention rule (see below)
);
create table public.move_in_items (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.move_in_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  room text not null, item text not null,
  condition text not null check (condition in ('good','worn','damaged','missing','not-checked')),
  note text check (char_length(note) <= 2000), recorded_at timestamptz not null default now()
);
create table public.move_in_messages (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.move_in_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null, channel text not null, summary text not null check (char_length(summary) <= 4000),
  created_at timestamptz not null default now()
);
-- owner-only RLS on all three
```
- **Rules:**
  - The record holds only text the signer typed. It makes **no** dispute advice, deadline or legal claims.
  - **Retention needs a decision.** A record that disappears in 30 or 90 days (ADR 0011) is useless for a deposit returned 12 months later. Proposal: keep it until the signer deletes it, with a yearly reminder, recorded in a new ADR.
  - **Photos are excluded** until the "never store the original file" rule is revisited. With photos, it would need a private Supabase Storage bucket, EXIF capture time and per-object RLS.

**5. Integration.** Links to `reviews` (optional), `homes` (10), fees (3) and print (8). It sits outside the review pipeline.

**6. Dependencies and tests.** None for the text version.
- RLS tests.
- Seeding tests: a fee "carpet cleaning upon move-out" produces a "Carpets" item.
- Retention job tests once the rule is decided.
- A print snapshot.

**7. Edge cases.**
- Timestamps are set by the server, but a signer can still enter entries late, so it's a record they keep, not tamper-proof evidence. The copy must not oversell it.
- A move-in record without a reviewed lease is allowed.
- Multiple co-signers: sharing (11) doesn't cover records unless extended.

---

## 4. Dependencies summary

| Need | Recommendation | New package? |
|---|---|---|
| PDF report | Print route plus print CSS | No. `@react-pdf/renderer` only if print-to-PDF tests poorly (**ask first**). |
| Text diff | Pure Myers diff in `src/features/compare/diff.ts` | No. The `diff` package is the alternative (**ask first**). |
| Readability score | Pure function | No |
| Email delivery of report | Deferred | Would need Resend, Postmark or similar (**ask first**, plus a data-sharing decision) |
| Co-signer invite | Supabase Auth invite or OTP | No (`citext` Postgres extension) |
| Statute data | Curated seed migration plus a review process | No (manual work: about 300 rows) |
| Photos (G6 reversal only) | Supabase Storage private bucket | No npm package; needs the settled rule changed |

`OPENROUTER_MODEL` is unchanged. New model calls: one fee-inventory call per review (3); optional readability rewrites (5); optional email polish (6). Each goes through `completeStructured` with JSON Schema and zod, and has an eval case.

## 5. Migrations, in order

`0007_flag_titles.sql` (5) → `0008_review_fees.sql` (3) → `0009_homes.sql` (10) → `0010_review_comparisons.sql` (9) → `0011_review_shares.sql` + share RLS (11) → `0012_statute_references.sql` + `reviews.state_code` (4, after G2) → `0013_move_in_records.sql` (12, after G6).

## 6. Recommended build sequence

Ordered by how much each step builds on existing code, then by risk to the trust claim (ADR 0012), then by the value LeaseGuard's own positioning suggests.

| Phase | Features | Why this order | Gate |
|---|---|---|---|
| **0. Decide** | G1–G6 | Six features can't be designed to completion without them | You |
| **1. Extend what exists** | 7 severity display → 5 titles and readability → 2 clause map → 6 negotiation email | Mostly frontend and pure functions over verified data; zero or one schema change; no new model risk | None |
| **2. New outputs from the same review** | 8 print report → 1 findings grade → 3 fee inventory | The print view shows Phase 1 work; the grade is a pure function once G1 is decided; fees add a model call and need eval coverage first | G1, G3 |
| **3. Multiple reviews** | 10 homes dashboard → 9 comparison | Comparison builds on clause segmentation (2) and the dashboard's grouping | G4 |
| **4. Other people and the law** | 11 co-signer sharing → 4 state references | Sharing changes RLS (security review); references need curated, reviewed legal data | G5, G2 |
| **5. After signing** | 12 move-in record | Widest scope change (ADR 0002); its own retention ADR | G6 |

**Before each phase:** write the tickets (proposed numbers 23–34, one per feature) with acceptance criteria taken from the "Tests" sections above. Then run `npm run typecheck && npm test && npm run build`, plus `npm run eval:gated` whenever a prompt or schema changes.

## 7. What this research can't tell you

- Whether LeaseGuard's analyzer output on real leases matches its sample. No real lease was run (see the README).
- Whether its statute statements are accurate. They weren't checked, and must not be reused.
- How its score, its clause splitting, its comparison, its dashboard or its sharing actually work. Each design above is Blue Line's own.
