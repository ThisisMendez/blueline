# 25: Clause map

**What to build:** A collapsible "Every clause" view on a completed review that lists each clause of each document in order. Each row shows the clause heading (or its first words) and what Blueline found there:
- a flag, with its severity
- a match with one of the signer's red lines
- a checklist topic it addresses
- "No material flag found in this clause"

Selecting a flagged row moves focus to that flag's card. The review header reads "N clauses read · M flagged".

**Why:** LeaseGuard AI reports "26 clauses reviewed · 8 issues found". Seeing the clauses that weren't flagged shows the signer the whole lease was read, not just the parts that were flagged. Blueline already has every offset needed, so this is pure computation over the stored text. Source: `research/competitors/leaseguard-ai/05-implementation-blueprint.md`, feature 2.

**Blocked by:** none (uses flag titles from 24 if present, otherwise the cited sentence)

**Status:** ready-for-agent

**Scope:** a new `src/features/clauses/` folder (a pure `segmentClauses` function, its tests and a `ClauseMap` component), wired into `ReviewResult.tsx`. No model call, no schema or migration change.

- [ ] `segmentClauses(document)` returns `{documentId, index, start, end, heading}`, with offsets into `ExtractedDocument.text`. The rules:
  - split on numbered or "Section"/"Article"/"§" headings and all-caps heading lines
  - with fewer than 3 headings, fall back to blank-line paragraphs, then sentences
  - merge fragments under 40 characters into the next clause
  - split clauses over 2,000 characters at sentence boundaries
- [ ] It's deterministic: the same text always gives the same clauses, and `text.slice(start, end)` returns the clause exactly
- [ ] A clause's status comes from offset overlap, in priority order: risk flag (highest severity among the overlapping flags), then preference match, then found checklist topic, then none. A flag that straddles two clauses marks both.
- [ ] The "none" wording never says the clause is safe or acceptable. It goes through the humanizer and `findLegalClaims`.
- [ ] Each document in a packet gets its own group, in packet order
- [ ] Collapsed by default. Rows are keyboard operable, and selecting a flagged row focuses its `RiskFlagCard`.
- [ ] Blocked, out-of-scope and unverified outcomes show no clause map
- [ ] Tests:
  - segmentation on numbered, unnumbered and mixed fixtures from `tests/fixtures`, plus a single-paragraph PDF extraction
  - offset round-trip
  - every verified flag maps to at least one clause
  - status priority
  - a component test of the focus jump
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass
