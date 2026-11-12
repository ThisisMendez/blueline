# 20: Small forfeitures flagged at Low, and a label overlay for the clean documents

**What to build:** Keep the materiality standard from ticket 15. Prompt and PRD say a small forfeiture that meets it is flagged at Low. The gold set marks three documents benign, so every flag on them counts as a false alarm even where a term forfeits prepaid money or property. A separate overlay, `evals/gold-set/label-corrections.json`, lists the sentences that conflict with the standard, and the report splits valid Low forfeiture flags from false flags.

**Blocked by:** 15

**Status:** built; the overlay is a proposal pending owner confirmation

- [x] Prompt bullet and PRD row and materiality sentence: a small forfeiture is Low, not left out
- [x] Overlay lists document, exact sentence (verified verbatim and unique by test), original label, corrected label, standard and reason; original labels untouched
- [x] Overlay frozen before candidate runs; SHA-256 recorded in `evals/gold-set/README.md` and checked by a test
- [x] Original 26-risk benchmark scored exactly as before; revised clean-document view reported separately
- [x] Unit tests for overlay application and the forfeiture-vs-false-flag split
- [ ] Owner confirms or rejects the four corrections (clean-document: 2, swim-lesson-registration: 2; library-volunteer-agreement: none)

## Measured (final prompt)

Overlay SHA-256 `707215fdab15f00596a353ae6403b7cf45c262fdf0fbd849094692ff383d4a72`, frozen before the first candidate run.

| Run | Original clean docs (no flags) | Valid forfeiture flags | False flags | Revised clean docs |
|---|---|---|---|---|
| 2026-11-11T20-30-21 | 1/3, 4 flags | 4 (3 low, 1 medium) | 0 | 3/3 |
| 2026-11-12T03-42-15 | 1/3, 4 flags | 4 (all low) | 0 | 3/3 |
| 2026-11-12T03-46-02 | 1/3, 3 flags | 3 (all low) | 0 | 3/3 |

Original-benchmark recall 25, 25, 26 of 26 across these runs. `npm run eval:gated`: all nine out of scope.
