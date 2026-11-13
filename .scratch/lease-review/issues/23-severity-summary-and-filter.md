# 23: Severity summary and filter

**What to build:** The top of a completed review gets a count line built from the verified flags: how many high, medium and low flags there are. Above the flag list, filter chips (All, High, Medium, Low) narrow the list without changing its order. Each flag card gets a "Why this severity" disclosure that shows the flag's triggering condition, which is the text the severity rests on.

**Why:** LeaseGuard AI's report opens with exactly this kind of count ("1 high-risk, 4 medium-risk, 3 low-risk"). Signers with many flags need to see where the serious ones are before reading every card. Severity already exists and is ranked by consequence (ADR 0003). This ticket makes it visible at a glance. Source: `research/competitors/leaseguard-ai/05-implementation-blueprint.md`, feature 7.

**Blocked by:** none

**Status:** ready-for-agent

**Scope:** `src/features/review/components/ReviewResult.tsx` and `RiskFlagCard.tsx`, plus a pure helper for the counts. No schema, model, route or migration change.

- [ ] The count line shows the number of flags at each severity, taken from `review.riskFlags` after verification
- [ ] When `droppedFlagCount > 0`, the line says some flags couldn't be shown because their quotes didn't match the lease. It never folds them into the counts.
- [ ] Preference matches and not-found items aren't counted (ADR 0007)
- [ ] A clean review shows the existing `CLEAN_REVIEW_STATEMENT` and no count line or filter
- [ ] Filter chips keep `rankFlags` order (severity, then document, then position) and are keyboard operable, with `aria-pressed`
- [ ] A filter with no matching flags shows its own short message, not an empty list
- [ ] "Why this severity" shows `triggeringCondition` and follows the same reveal order as the explanation (ADR 0010: consequence before negotiation language)
- [ ] No 0–100 score is added. Severity stays the three-level scale (ADR 0003).
- [ ] All new copy runs through the humanizer skill and passes `findLegalClaims`
- [ ] Tests:
  - the count helper on mixed, all-low and empty flag lists
  - a component test that filtering keeps order and that counts match the cards shown
  - the clean-review and dropped-flag cases
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass
