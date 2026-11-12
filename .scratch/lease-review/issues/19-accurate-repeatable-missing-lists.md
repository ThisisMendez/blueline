# 19: Accurate, repeatable missing-document lists

**What to build:** The completeness gate lists every document the lease requires and the packet lacks, once each, under one name, in the order the lease names them, and gives the same list every time for the same lease. Each item is grounded in the sentence that requires it. A packet still missing a required document stays incomplete.

**Why (decision 3):** Over three runs of the five development templates only L08 had the same missing list every time (1/5). Two entries were duplicates (L03 "Unit Inspection Report" under two names; L07 handbook twice). L01's missing document changed from run to run, and L01 was sometimes reviewed.

**Blocked by:** 13

**Status:** built; checked live on the five development leases

- [x] The model classifies every document the text names as `required`, `conditional` or `mentioned` (schema field `requirement`). Only `required` documents are verified and can block. The citing sentence for a required document is the one that attaches, incorporates or binds the signer to it. A reply with the field missing is read as `required`, the answer that blocks.
- [x] One identity per document, settled in code (`src/features/packet/reference-identity.ts`): the same form number; the same attachment designation in the same citing document; the same words once labels, form numbers, brackets, case, punctuation, "&"/"and", possessives and filler words are set aside; or a single chain of longer names ("Student Code of Conduct" inside "Ohio University Student Code of Conduct"). A short name that two unrelated longer names contain is not merged, and words such as "move-out", "pet" or "renewal" keep documents apart.
- [x] One name per document: the fullest name in the group, extended to the fullest title-case form the lease itself uses, with any form number added back as "(form HUD-50059)".
- [x] One order: where the lease first names the document, then the requiring sentence.
- [x] A sentence naming several documents gives each its own entry. Before, ids came from the sentence alone, so only the first survived.
- [x] A signer's earlier answer still applies when the next check cites a different sentence for the same document (the id carries the document's identity after `~`).
- [x] The completeness gate locates a requiring sentence with curly and straight quotes (and dashes and hyphens) treated as equal. The sentence shown is still cut from the signer's text. Flag citations keep the strict rule.
- [x] `npm run eval:leases` runs only the development leases (fixed list) and takes `--repeat N` and `--only <id>`. It retries rate-limited documents after a wait and doesn't count them. It prints a repeatability summary, duplicates, the model-unreadable count and reply-validation counts, and scores each missing list against the reading below.
- [x] Tests: `reference-identity.test.ts` and `completeness.test.ts`, synthetic text only.

**What each development lease requires (own reading of the extracted text, not adjudicated labels):**

| Lease | Required and not supplied | Not counted, and why |
|---|---|---|
| L01 Philadelphia | none, so it should be reviewed | "List of Addenda to the Lease:" is a blank template field; the lead water-line pamphlet is a notice the tenant is "advised to read"; "future addenda" don't exist yet |
| L03 HUD-90105a | Attachment 1 (owner's certification, HUD-50059), Attachment 2 (Unit Inspection Report), Attachment 3 (VAWA Lease Addendum, HUD-91067). Each at most once | Attachments 4 to 10 sit under "If Applicable"; VAWA notice forms HUD-5380/5382 are mentioned, not attached |
| L07 CU Boulder | the four policies section 15 "incorporated by reference and made a part of the Lease": Resident Handbook, Student Code of Conduct Policies and Procedures, OIEC Resolution Procedures, CUUF policy | Occupant Agreement (only for an occupant 18 or older); weapons addendum (only if one applies); Intent to Vacate form (the tenant hands it in) |
| L08 Maine | none (rules written into the lease) | |
| L10 Ohio Ecohouse | Ohio University Student Code of Conduct (tenant "shall observe and comply with") | the lease application is the tenant's own submission. This is a judgement call: the corpus annotation counts it as incorporated |

**Live results** (`npm run eval:leases -- --repeat 3`, 2026-11-11/12, with the `evals/live-route.ts` budget change from ticket 22 applied locally). Run outputs stay in `evals/lease-corpus/runs/` (gitignored).

| Set | Code | Identical on every repeat | Duplicates | Lists matching the reading | Note |
|---|---|---|---|---|---|
| baseline | before | 1/5 | 2 | not scored | coordination file |
| A | c2b72c5 | 4/5 | 0 | 15/15 | L10 named "University Student Code of Conduct" once; fixed by taking the name from the lease (4e77b6a) |
| B | 4e77b6a | 2/5 | 0 | 7/7 that completed | provider degraded: empty replies and 30 s timeouts; 8 of 15 runs failed for that reason |
| C | 4e77b6a | 4/5 | 0 | 14/14 that completed | L03 once `unverified`: the reply typed ' for ’ and the retry missed too; fixed by folding quotes when locating (13f222d) |
| D | 13f222d (final) | **5/5** | **0** | **15/15** | |

On the final code, every run gives L01 reviewed, L03 the three required attachments, L07 the four incorporated policies, L08 reviewed and L10 the Student Code of Conduct, in the same order and under the same names. No false scope blocks in any set (0/60).

**Limits:** the identity rules are heuristics checked on five templates and synthetic tests. The containment rule's list of distinguishing words is short and won't cover every pair of related documents. The `requirement` classification is the model's; the code only enforces what it does with it.
