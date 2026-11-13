# 15: Materiality standard and severity definitions

**What to build:** Ordinary payments don't produce risk flags on their own (Option B decision 4). The analysis prompt and PRD.md state one operational standard: a term earns a flag when it creates an obligation beyond the basic deal, a penalty or charge for leaving, changing or missing a step, the loss of a right, remedy, refund or option, or exposure that is large, open-ended or out of proportion. Whether a term deserves a flag and how severe it is are judged separately. Severity weighs size, cap, duration, how plausible the trigger is, reversibility and housing stability, and a blank or unsupplied amount is reported, never guessed.

**Blocked by:** 01, 12

**Status:** built; the owner chose to retain supported small forfeitures as Low findings on November 13, 2026

- [x] Prompt rule 2 lists the four kinds of material downside; new rule 5 says ordinary payments aren't flags and gives the test for when a payment becomes one
- [x] Severity paragraph: flag vs severity are separate; six factors; blanks and unsupplied amounts reported, not guessed
- [x] PRD.md "My red lines" carries the same standard; `evals/reviewer-guide.md` applies it for people
- [x] Wording is general: no gold-set document or phrase appears in it
- [x] In-scope recall doesn't drop: 25/26, 25/26, 25/26 (baseline 20–24/26); auto-renewal 6/6 in all three
- [x] Groundedness holds: 55/55, 57/57, 56/57
- [ ] Clean-document flags fall toward 0: **not met.** 2, 2 and 4 flags (baseline 2–3). The flags are the garden licence's no-refund on early exit and its leftover-property term, and in one run the swim registration's no-refund after the third lesson. Under the approved standard each is a forfeiture (prepaid money for a period or service the signer won't get, or property), not an ordinary payment, and the owner labelled the garden and swim flags PASS. The gold set calls those documents clean. Two of the three runs graded every clean-document flag low, where earlier runs used medium.

**Owner decision:** Treat a small forfeiture of prepaid money or property as a Low finding when the quoted clause supports it. Use the label overlay in ticket 20 to show how the chosen rule affects the clean-document result. Keep the original benchmark for comparison.

Runs: `evals/gold-set/runs/2026-11-11T19-22-55.421Z-ungated`, `…19-26-35.335Z-ungated` (swim registration left out: checklist reply in the wrong shape), `…19-30-15.073Z-ungated`.
