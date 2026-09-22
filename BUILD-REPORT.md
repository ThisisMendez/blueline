# Build report

## Current checkpoint — 2026-09-22

Status: implementation in progress. Branch `main`, existing upstream `origin/main`.
Starting commit: `1a87788` (seven commits ahead at entry). No history rewritten.

The starting dirty files belonged to unfinished ticket 04: coverage schema, verifier,
presentation, fixtures and migration 0002. Preserved and completed them. Other attached
sessions were idle after the prior Claude build hit its session limit; no sessions
were terminated. No unrelated edits found. Earlier report versions remain in Git.

| Ticket | Status and implementation commits |
| --- | --- |
| 01 Paste and cited flags | Verified offline: `4a7bd53`, corrected anonymous/error handling `9507bf4`; hosted auth/DB pending |
| 02 Selectable PDF | Verified offline: `c013fe1`; native Chrome upload permission blocked |
| 03 Complete agreement | Verified offline: `1a87788`, stricter failed-reference handling `9507bf4` |
| 04 Coverage checklist | Verified offline: `9507bf4` |
| 05 Grounded Q&A | Verified offline: `d03b74b` |
| 06 Personal red lines | Implemented and verified offline `b7eb335`; DB/live quality pending |
| 07 Counter-offers | Implemented and verified offline; live plausibility pending; commit recorded next checkpoint |
| 08 Retention | Ready; storage/scheduler plan inspected |
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

## Dependencies and fixtures

No dependencies added during this resumed session. Earlier build added Supabase client
and SSR adapters (real accounts/storage), Zod (response validation), pdfjs-dist (selectable
PDF extraction), Vitest/jsdom/Testing Library tooling (deterministic flows) and tsx
(smoke/evaluation scripts). Existing npm lockfile preserved.

Existing synthetic fixtures reused: planted-risk lease, clean lease, referencing lease,
fee schedule, pet addendum, selectable PDF and textless PDF. Sidecar exact quotations
are checked verbatim. They contain no real personal information and are implementation
fixtures, not independently human-adjudicated evidence. Fixture provenance documented.

## Verification completed so far

- Ticket07: required proposed-edit/residual-risk fields flow through schema, verifier
  and storage. Keyboard-tested two-step disclosure across all planted flags; closing
  explanation hides draft and residual together. Missing/empty fields fail validation.
  Legacy stored flags require a new analysis, never invented content. Main inspected
  source/diff/migration/tests. Typecheck, lint, 196 tests, offline smoke and fixture
  production build pass. Humanizer applied. SQL/live plausibility remain pending.
- Browser harness committed as `fc9a7d7`; fixture build passes with all current routes.

- Ticket06: main inspected routes, model contract, citation checks, real preferences
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
  unsupported independent-reviewer claim. Native browser run pending final UI integration.

- Tickets 01–04: typecheck, lint, 161-test full suite and offline smoke passed.
- Ticket 05: main inspected schema, route, UI, fixtures and tests; typecheck, lint and
  all 172 deterministic tests passed. Eleven Q&A tests cover grounded/non-answer flows,
  incomplete packets, addenda, fabricated/wrong-document citations, provider errors and
  failed retry handling. No model credentials required.
- `npm run build` passed at `385279e`, preserving `/`, `/sign-in`, `/review`,
  `/review/[reviewId]`, `/api/analysis` and `/auth/confirm`. Final build pending integration.
- `npm run smoke` runs the actual internal route/pipeline with deterministic model
  responses: planted 9 returned/9 verified/0 dropped; clean 0/0/0 with missing repairs
  and dispute routes; incomplete packet blocked with both missing references named.
  It prints mode, sources and verification counts.
- `npm run smoke -- --live` is explicitly bounded to one synthetic packet, six requests,
  per-call timeout and a start budget. Key/model configured, values never printed.
  Run once after final schema integration. Live provider compatibility remains unknown.
- Evaluation scorer/harness: 11 behavioral tests pass; `npm run eval` checks prerequisites
  and reports pending/exit 2 without a live request when evidence is absent. Generated
  reports are ignored. No quality result has been manufactured.

## Browser, copy and external limits

- Native Chrome inspected landing/intake at 1280×900 and 390×844, plus landing reflow
  at 320px. No observed horizontal overflow. Keyboard skip link navigates to main.
  Anonymous navigation via sign-in, empty submission and unconfigured-model error work.
- Local browser server deliberately has empty model variables; synthetic error check
  sent no external request. Only this session's own server was restarted.
- Chrome PDF upload failed `Not allowed`: enable “Allow access to file URLs” for the
  ChatGPT extension to resume. No browser permissions changed. Parser/offline flow tests pass.
- Independent native reviewer checked landing claims. Corrected unsupported sample
  re-renting fee and anonymous retention qualification; clarified red-line accounts/reruns.
  Reviewer signed off on revised claims conditional on completion of tickets 05–08.
- Checked color pairs: navy/paper 10.31:1, red/paper 4.91:1, 70% ink/paper 5.23:1,
  70% paper/navy 5.90:1. These and limited keyboard/reflow checks are not full WCAG AA
  evidence. Screen-reader, text-spacing/zoom and comprehensive interactive checks pending.
- Supabase variables absent; no local psql/Docker. Client-boundary mocks do not prove
  deployed SQL, RLS, transactions or scheduled deletion. Database verification is separate.
- Ticket 09 blocked by missing independent held-out corpus, two reviewers' pre-output
  adjudication, restricted runner and full-flow human evidence. Retry count 0; does not
  block remaining implementation. Agent-authored fixtures cannot satisfy this gate.

## Resume without rebuilding completed work

Current uncommitted ownership: verified ticket07 and main report/smoke additions. No unrelated work.
Next: commit 07, implement 08; final smoke/build,
practical browser checks, status synchronization and normal push to `origin/main`.

Routine commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run smoke`,
`npm run build`. Final live check: `npm run smoke -- --live`. Evaluation instructions:
`evals/README.md`. Do not treat SQL mocks as database sign-off or repeat completed work
merely because the original report was stale. No automatic restart after session closure.
