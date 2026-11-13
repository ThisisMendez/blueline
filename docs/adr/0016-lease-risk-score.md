# 0016. A Lease Risk Score built only from verified flags

## Decision

A completed review shows a Lease Risk Score from 1 to 100 with a letter grade, computed by a pure, versioned function (`src/features/score/`, version `lrs-1`). A higher score means fewer or less serious concerns were found for the side the user picked. The rule is in [docs/scoring.md](../scoring.md):

- Deduct 16 per distinct verified High flag, 7 per Medium and 3 per Low from 100.
- The most serious flag sets the band and the score is clamped into it: two or more High is 1 to 59 (F), one High is 60 to 69 (D), Medium without High is 70 to 79 (C), Low only is 80 to 100 (A or B), no flags is 100.
- The same rule for renter and landlord reviews.

Only verified risk flags count, each once however many passages it cites. Checklist topics that weren't found (ADR 0007) and personal red-line matches never change the score.

The score is unavailable, with a reason, for a blocked, out-of-scope, unverified, failed or rejected request; for any review where a proposed flag was dropped because its quote didn't match (`droppedFlagCount > 0`); for a saved review from before role selection; and for stored data the rule can't read.

## What the score is not

It is never approval to sign, a finding that a term is legal or enforceable (ADR 0014), a probability that harm will happen, or a guarantee that every risk was found. The review only flags terms with a material downside; it does not grade every clause. The score restates on one scale what the ranked flag list already says.

## Supersedes and refines

- Supersedes the line "No 0–100 score is added. Severity stays the three-level scale (ADR 0003)" in ticket 23. Severity stays the three-level scale; the score is derived from it and adds no fourth level.
- Refines gate G1 in `QUESTIONS.md` (owner, 2026-11-12: "a deterministic risk grade from verified flags ... never 'safe to sign' or 'good/bad lease'"). The grade labels describe concerns found ("Few or no concerns found" to "Severe concerns found") instead of "Low risk" to "High risk", because the score can only speak to what was found in the text, not to the risk of the lease.

## Why these choices

- **Bands set by the worst flag.** ADR 0003 makes a single High flag a potentially decision-changing loss. Under the starting rule (cap 79 for any Medium or High), one High flag scored 79, a C labelled "Notable concerns". On the development lease L01 the starting rule gave 78 or 79 (C) for a review with one High flag in each of three repeat runs. The D cap at 69 fixes that.
- **Floors.** Without them, eight Low flags reach C and five Medium flags reach D. A "High-risk concerns" or "Severe concerns found" label on a review with no High flag contradicts the counts shown next to it. Floors keep the grade consistent with the severity vocabulary, and the score still never rises when a flag is added.
- **Two High flags cap at 59.** The lead's reading of the truncated brief. Confirmed: two independent decision-changing losses is the plainest case for the lowest grade, and the fixture packets with two or more High flags all land in F.
- **Dropped flags withhold the score.** A dropped flag's severity is never stored, so nothing can prove it would not have lowered the score. Showing a score that could be too high is the false reassurance ADR 0005 exists to avoid.
- **Legacy reviews withheld.** Reviews saved before role selection (migration 0007, ADR 0015) predate the current severity rules (tickets 15, 18, 20) and may have been graded differently. They expire within 90 days, so the cost is small.

## Costs

- The score inherits the model's severity judgment and its run-to-run variation. On development lease L08, three identical runs gave one Medium and two Lows (79, C) once and three Lows (91, A) twice. A grade can change between runs of the same lease.
- Inside a band, caps flatten small differences: one High alone and one High with two Mediums both score 69. The counts shown beside the score carry that detail.
- Scores of 89 and 90 can't occur with these weights, because Low-only reviews move in steps of 3.
- No held-out or independent evidence yet supports any severity for either role (see [docs/beta-claims.md](../beta-claims.md)). The score must not be described as validated.

Changing a weight, cap, band or label changes the version. [ADR 0003](0003-rank-lease-flags-by-consequence.md), [ADR 0007](0007-separate-absences-and-preferences-from-risk-flags.md), [ADR 0014](0014-layer-1-reads-the-lease-not-the-law.md), [ADR 0015](0015-renter-first-with-landlord-reviews.md).
