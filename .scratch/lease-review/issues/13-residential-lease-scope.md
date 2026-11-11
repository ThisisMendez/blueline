# 13: Residential-lease scope and unverifiable completeness

**What to build:** The completeness check also says what kind of agreement the packet is. A packet that isn't a residential lease, or that the check can't place, is stopped before review with a clear explanation (ADR 0014). A packet whose document references can't be verified after one retry gets an explicit "We couldn't confirm your packet is complete" state, never a review and never a generic error.

**Why:** The product reviewed non-lease documents. In the gated run of 2026-11-10T18:48 a garden licence, a volunteer agreement and a swim registration all passed and were reviewed. The landing page already says other agreement types aren't covered.

**Blocked by:** 03 (completeness gate)

**Status:** built and checked on five real public leases

- [x] One completeness call returns `agreement.kind` (residential-lease, not-a-residential-lease, unclear); no extra model call
- [x] A "not a lease" answer must quote a sentence from the signer's text; without one it is reported as unclear
- [x] Analysis route returns `out-of-scope` or `unverified` and never runs the review; Q&A answers neither
- [x] Review screen shows the stopped state, the document's description and the quoted sentence
- [x] Unverifiable references return `unverified` instead of throwing a generic verification failure
- [x] Gated gold-set run blocks all 9 non-lease documents as out of scope (`evals/gold-set/runs/2026-11-11T18-59-39.673Z.txt`)
- [x] Live smoke on a synthetic residential lease still reviews (9 flags verified)
- [x] No false scope blocks on real residential leases: 0/5 in three live runs of `npm run eval:leases` (2026-11-11), and 0/5 on the pre-change code

The prompt names categories generically (commercial or storage lease, membership, service or subscription, employment, licence to use land or a facility). It does not list the gold-set documents, so the gated gold-set result is not tuned to them.

**Completeness on real leases (decision 3):** four of the five public leases were blocked as incomplete before this change too (baseline run on commit 3c9c880), and the documents named missing varied from run to run. HUD-90105a was blocked on attachments it lists only conditionally ("House Rules (if any…)", pet and security addenda). The completeness prompt now treats an attachment named only conditionally ("if any", "if applicable", "where required", a box left to tick) as a reference only when the text shows the condition applies. Two runs after the change: HUD blocks only on its three required attachments; CU Boulder and Ohio block on documents their text incorporates; Maine is reviewed; Philadelphia was reviewed once and failed once with `model-unreadable`. These are templates, so most are genuinely incomplete as supplied. That rule is prompt-only and checked live, not by a unit test.
