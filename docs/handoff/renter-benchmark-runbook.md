# Renter accuracy benchmark: reviewer packet and runbook

November 18, 2026. Scope: renters. The [five-template set](../../evals/holdout/README.md) remains unapproved for this benchmark. Its owner-confirmation flag is false; no frozen human labels or seal exist in the planning checkout.

## What passed now

- All 33 tests under `npm test -- evals` passed, including scoring, exact-quote checks, worksheets and the guards that refuse to score without the required evidence.
- Both offline smoke runs passed. On the three synthetic cases per role, the pipeline checked exact citations for nine planted findings, returned no findings on the clean example, and stopped the incomplete example before issuing findings. The smokes inject deterministic model responses. They check how the app handles results, not whether an AI will discover the right concerns on its own.
- No live model calls, real lease documents, or private labels were used for this check. The recorded AI development pass remains separate.

## Hand this to the reviewers

Use the [synthetic practice sheet](renter-benchmark-practice.md) to rehearse. Give each reviewer a separate copy and let them work without sharing answers. Give the third person both submitted copies only after both are done. The rehearsal uses fictional text and does not count toward the benchmark. For the actual benchmark, use the approved locked files, [reviewer guide](../../evals/reviewer-guide.md), and [existing worksheet instructions](../../evals/lease-corpus/calibration/README.md).

**Invitation draft (unsent):** Would you volunteer to help test a tool that explains rental agreements? It involves reading example documents from a renter’s point of view, marking terms that could affect a signing decision, and citing the exact sentence. It does not require deciding whether a clause is enforceable. To keep the result independent, please do not look at Blueline or AI outputs or discuss the examples with another reviewer before submitting. We’ll share the exercise once the set and its use are approved.

**Coordinator only: synthetic rehearsal check.** A candidate serious term is section 3 of packet A: its trigger is leaving early and its consequence is charging all future rent even after a replacement tenant pays. Packet A's payment timing and routine repair email are ordinary in this exercise. Packet B should be held because it incorporates a fee schedule that was not supplied. Reviewers should cite the exact text and leave disagreements visible for the third person; do not share this note before their submissions.

## Remaining sequence

1. Confirm the five-template set, the substitute and its use terms with the owner before anyone accesses or distributes the files. Get two independent volunteers and a third, separate person to resolve disagreements. Keep contact details and quotes out of the public repo.
2. Run the practice round. Then circulate the approved private worksheets without product outputs. Confirm each reviewer worked independently and record only what the examples actually say.
3. Resolve disagreements, validate exact quotes and freeze the labels. Verify the seal before scoring. Check the deployment's data handling and get a budget preflight and separate authorization before any live run.
4. Report serious misses, false flags, citation accuracy, and which packets were correctly or incorrectly stopped. Include counts and limits of this small renter set. Do not imply accuracy for landlords or for real leases before this is complete.
