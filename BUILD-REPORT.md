# Build report

## Current checkpoint — 2026-09-22

Status: all unblocked implementation and local verification finished; external release
gates remain below. Branch `main`, existing upstream `origin/main`.
Starting commit: `1a87788` (seven commits ahead at entry). No history rewritten.

The starting dirty files belonged to unfinished ticket 04: coverage schema, verifier,
presentation, fixtures and migration 0002. Preserved and completed them. Other attached
sessions were idle after the prior Claude build hit its session limit; no sessions
were terminated. No unrelated edits found. Earlier report versions remain in Git.

| Ticket | Status and implementation commits |
| --- | --- |
| 01 Paste and cited flags | Verified offline and live transport: `4a7bd53`, corrections `9507bf4`; hosted auth/DB pending |
| 02 Selectable PDF | Verified offline: `c013fe1`; native Chrome upload permission blocked |
| 03 Complete agreement | Verified offline and native browser gate: `1a87788`, stricter handling `9507bf4`, selector correction `24dc67b` |
| 04 Coverage checklist | Verified offline: `9507bf4` |
| 05 Grounded Q&A | Verified offline: `d03b74b` |
| 06 Personal red lines | Implemented and verified offline `b7eb335`; DB/live quality pending |
| 07 Counter-offers | Implemented and verified offline `09427ea`; live draft/residual concern needs independent review |
| 08 Retention | Implemented and verified offline `24dc67b`; hosted DB/RLS/cron verification pending |
| 09 Independent evaluation | Tooling verified: `385279e`; independent evidence blocked |
| 10 Landing | Implemented `90e28f1`, truthful copy corrections `c61f93e`; full WCAG verification pending |

Worker verification failures: 0. No blocked partial implementation commits.
Main owns status, integration, commits and this report. Workers do not push.

## Decisions and narrow requirement corrections

- This run explicitly supersedes older sign-in-before-analysis text. Anonymous analysis
  works whether or not Supabase is configured and is never persisted. Only library and
  personal red lines require an account. Corresponding PRD/spec/surface text corrected;
  unrelated ADR decisions retained.
- OpenRouter uses only `OPENROUTER_MODEL` and server-side `OPENROUTER_API_KEY`, the
  OpenAI-compatible endpoint, Fireworks-only routing, no fallback, required parameters,
  low reasoning and validated structured JSON. HTTP-200 provider errors stay errors.
- Citation matching normalizes whitespace only and displays original source slices.
  Wrong documents and fabricated quotations fail verification. One retry; all dropped
  flags cannot become a clean result. Failed completeness/checklist verification stops
  review rather than showing a partial or apparently clean result.
- Retry drop counts are conservative: a recovered flag must preserve consequence and
  condition to retire its failed candidate; changed prose can retain a dropped count.
- Q&A deliberately displays only verified extractive answers, with document/offset
  citations. Free-form outside prose is rejected. Relevance still needs live evaluation.
- No hosted Supabase project created and no remote migrations applied. Real client
  reads the two prescribed public variables at request time. Migration SQL is tracked
  through a narrow ignore exception; database dumps remain ignored.
- Feature-first layout and existing public routes/design retained. Read local installed
  Next 16.3.5 docs. No duplicate application or new design direction.
- Implement and TDD skills applied at approved full-flow/external-boundary seams.
  Humanizer 3.0.0 was available and applied to new copy. Broad final code review skipped
  as requested; main still inspects every ticket diff and relevant source.
- Retention uses database-owned dates and atomic write RPCs, not caller timestamps.
  Direct table writes are revoked; owner and expiry policies constrain reads. An
  explicit save resets expiry to 90 days from that save; default retention is 30 fixed
  24-hour days. Expiry blocks access immediately; successful minute-based maintenance
  physically deletes the review and all stored text on its next run. No exact-instant
  physical-deletion claim. Missing cron support is a deployment blocker.
- A storage failure leaves an explicitly ephemeral usable review with a warning;
  it never claims successful persistence. SQL relationship hints avoid ambiguity from
  composite ownership foreign keys. Controlled clocks replaced stale test dates.

## Dependencies and fixtures

No dependencies added during this resumed session. Earlier build added Supabase client
and SSR adapters (real accounts/storage), Zod (response validation), pdfjs-dist (selectable
PDF extraction), Vitest/jsdom/Testing Library tooling (deterministic flows) and tsx
(smoke/evaluation scripts). Existing npm lockfile preserved.

Existing synthetic fixtures reused: planted-risk lease, clean lease, referencing lease,
fee schedule, pet addendum, selectable PDF and textless PDF. Sidecar exact quotations
are checked verbatim. They contain no real personal information and are implementation
fixtures, not independently human-adjudicated evidence. Fixture provenance documented.

## Final verification

All checks below ran after the final retention and selector changes. No dependencies
or product source changed after these checks; subsequent edits only synchronize records.

| Command | Result |
| --- | --- |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm test` | Pass: 212 tests, 24 files; no live credentials needed |
| `npm run smoke` | Pass, deterministic/offline mode; actual internal pipeline |
| `npm run build:fixtures` | Pass; native browser final integration checked |
| `npm run build` | Pass; normal production output restored after fixture build |
| `npm run smoke -- --live` | One bounded run; 3 calls, 9 returned / 9 verified / 0 dropped, no provider errors; quality concerns below |
| `npm run eval` | Expected exit 2: prerequisites missing, 0 live runs, expansion decision pending |
| `git diff --check` | Pass |

Offline smoke: planted agreement 9/9/0; clean agreement 0/0/0, with repairs and dispute
routes separately not found; incomplete agreement blocked before review, naming the
Schedule of Resident Fees and Pet Addendum. Smoke prints mode, exact sources and counts.
Normal build preserves the landing, sign-in, review and saved-review routes and adds the
approved Q&A, personal-red-line and library-save API routes. Private environment files,
generated build output and evaluation runs remain ignored and untracked.

### Bounded live findings — not a quality pass

Configured OpenRouter model/provider accepted the required routing, low reasoning and
structured-output settings. Credentials and model values were never printed. All six
coverage topics were found. Citation verification proves source matching, not the
correctness of consequences, severity, counter-offers or residual-risk statements.

- Renewal-rent severity was medium versus the synthetic sidecar's high expectation.
- Venue clause 14.2 had no separate flag. The arbitration flag cited 14.1 but its
  consequence also referred to the landlord-office county from 14.2. Independent
  adjudication is needed before classifying this as a serious miss or acceptable grouping.
- A low-severity three-day repair-reporting warning needs false-alarm review.
- An arbitration draft replaced14.1 without its express jury/class-waiver wording,
  while its residual-risk statement still said jury/class proceedings were barred.
  This is a draft/residual consistency concern, not a conclusion about legal effect.

### Second live run, 2026-09-22 02:1x

A confirming live run went through the same path: 3 calls, 9 flags returned, 9 verified,
0 dropped, all six coverage topics found. The findings above held. The renewal-rent flag
again came back medium against the fixture's high expectation, and the arbitration draft
again removed the jury and class-waiver wording while its residual-risk sentence still
described class proceedings as unavailable. Two runs agreeing is not adjudication, but it
does mean these are the model's settled behaviour rather than one bad sample.

The first attempt at this run returned HTTP 429 and stopped cleanly at
`model-rate-limited` without producing a partial review. The configured model,
`z-ai/glm-5.3-flash`, rate-limits on back-to-back calls often enough that you should
expect this; wait a minute and run it again. The failure path is the one the product
would show a signer, and it is honest: no flags, no summary, no clean result.

The other drafts offered concrete compromises, but ticket 07's plausibility criterion
remains unchecked. No prompt, model, provider or expected-answer changes were made to
tune away these findings. Do not rerun a live test merely to obtain a cleaner result.
Ticket 09's independent adjudication gate remains unsatisfied.

## Ticket-level evidence

- Ticket 08: main inspected source, complete diff, UI, tests and migrations 0005/0006;
  a separate native worker performed a bounded SQL review. Controlled-clock tests cover
  expiry, full stored-object deletion, later/repeated saves and non-resurrection. Route,
  database-boundary and UI tests cover ownership, persistence warnings, save loading/error
  states and visible dates. README documents staging verification. No SQL execution.

- Ticket 07: required proposed-edit/residual-risk fields flow through schema, verifier
  and storage. Keyboard-tested two-step disclosure across all planted flags; closing
  explanation hides draft and residual together. Missing/empty fields fail validation.
  Legacy stored flags require a new analysis, never invented content. Main inspected
  source/diff/migration/tests. Typecheck, lint, 196 tests, offline smoke and fixture
  production build pass. Humanizer applied. SQL and independent live plausibility remain pending.
- Browser harness committed as `fc9a7d7`; fixture build passes with all current routes.

- Ticket 06: main inspected routes, model contract, citation checks, real preferences
  adapter, migration0003, UI and tests. Eleven new tests cover account isolation,
  save/edit/clear/reload, exact citations and unchanged general flags. Typecheck, lint
  and full suite pass (189 tests including six browser-harness tests), without warnings.
  Humanizer applied; no dependencies added. Preferences persist, match results are
  recomputed against the owned completed packet. Failed loading disables editing to
  avoid overwriting unseen preferences. SQL remains unapplied.
- Added separate `build:fixtures`/`start:fixtures` test commands for native browser
  checks. Only external OpenRouter HTTP responses are substituted; production imports
  and normal startup are unchanged. Loopback-only, exact synthetic fixtures only,
  anonymous only; build marker requires blank Supabase configuration at build time.
  Six behavior tests pass. Fixture provenance comments corrected to remove an old
  unsupported independent-reviewer claim. Native browser verification completed below.

- Tickets 01–04: typecheck, lint, 161-test full suite and offline smoke passed.
- Ticket 05: main inspected schema, route, UI, fixtures and tests; typecheck, lint and
  all 172 deterministic tests passed. Eleven Q&A tests cover grounded/non-answer flows,
  incomplete packets, addenda, fabricated/wrong-document citations, provider errors and
  failed retry handling. No model credentials required.
- `npm run build` also passed at the earlier `385279e` checkpoint; final results above
  supersede historical per-ticket test counts without repeating unchanged checks.
- `npm run smoke` runs the actual internal route/pipeline with deterministic model
  responses: planted 9 returned/9 verified/0 dropped; clean 0/0/0 with missing repairs
  and dispute routes; incomplete packet blocked with both missing references named.
  It prints mode, sources and verification counts.
- `npm run smoke -- --live` is explicitly bounded to one synthetic packet, six requests,
  per-call timeout and a start budget. Key/model configured, values never printed.
  Ran once after final schema integration; technical result and quality limitations above.
- Evaluation scorer/harness: 11 behavioral tests pass; `npm run eval` checks prerequisites
  and reports pending/exit 2 without a live request when evidence is absent. Generated
  reports are ignored. No quality result has been manufactured.

## Browser, copy and external limits

- Native Chrome fixture production preview at `09427ea`: observed analysis and Q&A
  loading, nine exact-cited planted flags, keyboard explanation/edit disclosures,
  residual risk beside the draft, grounded answer and explicit non-answer. Inspected
  desktop 1280×900 and mobile 390×844; no horizontal overflow or console warnings/errors.
  Clean fixture renders zero flags plus separate repairs/dispute-route absences;
  incomplete fixture names both missing documents and exposes neither review nor Q&A.
  Unknown synthetic text produces a service error, never a clean result. All model
  responses came from the test transport; no fake account and no live request.
- Browser found a confusing self-reference option in the document selector. Server
  already rejected it; main added a red/green full-flow regression and filtered the
  referring document out of choices. Final fixture build/browser confirms both selectors
  contain only the missing-document option for the incomplete fixture. Full suite passes.
  Temporary viewport overrides reset; this session's preview servers were stopped.

- Native Chrome inspected landing/intake at 1280×900 and 390×844, plus landing reflow
  at 320px. No observed horizontal overflow. Keyboard skip link navigates to main.
  Anonymous navigation via sign-in, empty submission and unconfigured-model error work.
- Local browser server deliberately has empty model variables; synthetic error check
  sent no external request. Only this session's own server was restarted.
- Chrome PDF upload failed `Not allowed`: enable “Allow access to file URLs” for the
  browser extension to resume. No browser permissions changed. Parser/offline flow tests pass.
- The PDF skill was consulted for supplementary fixture inspection; Poppler/pypdf/
  pdfplumber were unavailable. No duplicate tooling added: real pdfjs parser and flow
  tests remain the verification evidence, not an invented rendered-PDF check.
- Independent native reviewer checked landing claims. Corrected unsupported sample
  re-renting fee and anonymous retention qualification; clarified red-line accounts/reruns.
  Reviewer signed off on revised claims conditional on completion of tickets 05–08.
- Checked color pairs: navy/paper 10.31:1, red/paper 4.91:1, 70% ink/paper 5.23:1,
  70% paper/navy 5.90:1. These and limited keyboard/reflow checks are not full WCAG AA
  evidence. Screen-reader, text-spacing/zoom and comprehensive interactive checks pending.
- Supabase variables absent; no local psql/Docker. Client-boundary mocks do not prove
  deployed SQL, RLS, transactions or scheduled deletion. Database verification is separate.
  Native authenticated library, personal-red-line and save flows also need that staging
  configuration; offline UI tests cover their implemented loading/error/empty behavior.
- Ticket 09 blocked by missing independent held-out corpus, two reviewers' pre-output
  adjudication, restricted runner and full-flow human evidence. Retry count 0; does not
  block independent implementation. Agent-authored fixtures cannot satisfy this gate.
  No Humanizer review is pending: the actual installed skill was applied to new copy.

## Resume without rebuilding completed work

Retention integration, the main selector regression and synchronized acceptance evidence
were committed as `24dc67b`. Normal `git push` succeeded to the existing `origin/main`
upstream, advancing it from `b6ec739` through `24dc67b`, including the preserved earlier
session commits. No force-push, remote changes or credential changes. The worktree was
clean before this final records-only update; no unrelated or unowned changes remain.
This records update is committed and pushed separately. No blocked partial implementation
is represented as verified, and all migrations 0001–0006 are tracked. Private `.env.local`
and generated `.next`/evaluation output remain ignored and untracked.

Next actions requiring the owner's setup or independent evidence:

1. Configure an existing staging Supabase project, apply ordered migrations 0001–0006,
   and follow README's retention deployment gate: two-account RLS, atomic rollback,
   timestamp tampering, expiry/non-resurrection and administrative proof of cron-driven
   physical deletion. Set the prescribed public environment variables and verify real
   sign-in, library reload, red lines and save in the browser. No remote apply authorized here.
2. Supply the independently adjudicated held-out corpus, two reviewers and restricted
   runner described in `evals/README.md`; run `npm run eval` with that documented setup.
   Review the live observations above, especially draft/residual consistency, before
   marking ticket 07 or the independent expansion gate complete.
3. Enable the browser extension's file-URL access to finish native PDF upload, and
   complete screen-reader, zoom/text-spacing and remaining WCAG 2.1 AA checks.

Routine regression commands after changes: `npm run typecheck`, `npm run lint`,
`npm test`, `npm run smoke`, `npm run build`. Native synthetic preview:
`npm run build:fixtures` then `npm run start:fixtures`; use only documented fixtures.
Explicit live mode is `npm run smoke -- --live` (already run once for this build).
Do not repeat verified implementation because a report was stale. Do not treat SQL
mocks or agent-authored fixtures as external sign-off. No automatic restart after closure.
