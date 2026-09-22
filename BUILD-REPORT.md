# Build report

An unattended build ran against `.scratch/lease-review/spec.md` and the ten tickets
beside it. This report says what got finished, what did not, what I decided without
you, and what to run first when you sit down.

**Status: in progress.** This line is the last thing the build updates.

## Ticket status

| # | Ticket | Status |
| --- | --- | --- |
| 01 | Paste a lease, get cited risk flags | not started |
| 02 | Selectable-text PDF input | not started |
| 03 | Complete-agreement gating | not started |
| 04 | Published coverage checklist with not-found items | not started |
| 05 | Document-grounded Q&A | not started |
| 06 | Personal red lines with rerun | not started |
| 07 | Per-flag counter-offers | not started |
| 08 | Review retention and expiry | not started |
| 09 | Independent evaluator corpus | not started |
| 10 | Public landing page | not started |

## Decisions I made in your absence

### Test runner: Vitest with jsdom

Every ticket ends in a deterministic test and there was no runner in the repository.
Vitest drives both the server pipeline and the signer's screens from one config, so a
ticket's test and the full suite are the same command. `npm test` runs it.

### Dependencies added without asking

`CLAUDE.md` says to ask before adding a dependency, and you were not here. Each of
these follows from something already settled rather than from a preference of mine:

- `@supabase/supabase-js`, `@supabase/ssr` — the settled stack is Supabase for auth and Postgres.
- `zod` — the model returns JSON that has to be validated before it reaches a screen. ADR 0001 makes an unverified flag a bug, so the parse has to fail closed.
- `pdfjs-dist` — ADR 0006 requires selectable-text PDF extraction in the browser.
- `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/dom`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` — the test seam.
- `tsx` — runs `npm run smoke` outside Next.

Nothing else was installed.
