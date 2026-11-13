# Blueline Redline — first-version brief

Blueline is the project shorthand. The official product name and visual direction are in [BRAND.md](BRAND.md).

## Who this is for

A renter with a residential lease or renewal in hand and a signing decision approaching. Landlords reviewing the same kind of lease are supported too. Blueline Redline is a contract review tool: the user picks the side they are on, and the report highlights the clauses that could harm that side. It helps either party understand the agreement, identify consequential terms, and prepare informed questions or proposed changes before deciding. Use “Review your rental agreement from your perspective” and “Understand what could affect you and what to clarify before signing.” The user decides whether and how to act on the report.

The original renter research considered self-review, consumer lease analyzers, and paid lawyer review. It recorded a $440 average for rental-lease review on ContractsCounsel and did not measure how many renters use each route. [ContractsCounsel](https://www.contractscounsel.com/b/rental-lease-agreement-cost), [consumer lease analyzer research](research/agent3-what-already-exists.md).

## The problem

The signer may notice the monthly rent yet miss a costly exit term, deposit condition, or change to how a dispute can be pursued. Terms can also sit in referenced schedules or rules outside the main lease. The product must make the consequence of a term visible **before** the signing decision and show the sentence behind every warning.

One renter in the research warned others: “don't accept being forced to pay 1k+ for lease reassignment regardless of who finds the new tenant” ([Blind discussion](https://www.teamblind.com/post/apartment-lease-red-flags-kghqkg5a), recorded in [the research notes](research/agent1-who-has-this-pain.md)). This supports treating an exit fee as a concrete concern; it does not establish how common that fee is. The original Blind page could not be reopened while drafting this brief, so the quote is traceable through the research notes rather than independently rechecked here.

## What the first version does

1. **Explain the self-check before asking for a lease.** The public landing page explains the role-tailored review, cited risk flags, coverage checklist, counter-offers, personal red lines, and saved library. Its primary action, “Analyze Lease”, opens the review page, where anonymous review works without an account; sign-in stays available for the library and red lines. It states that this version is free to use. Copy avoids implying legal representation, action on the user's behalf, a safe-to-sign verdict, or a guaranteed outcome, and uses evidence-backed examples.
2. **Ask for the review role, then take a complete residential lease packet.** Require “I’m a renter” or “I’m a landlord” before showing the upload or paste controls. The selection belongs to this review and stays with it through retries, follow-ups, and reopening a retained review. Each new review asks for a selection. Anonymous analysis remains ephemeral. The library and personal red lines require an account. Accept pasted text and selectable-text PDFs, including every document the lease references. Parse files in the browser and retain only extracted text and review data for signed-in users. If any referenced document is missing, name it and stop before review.
3. **Return one role-tailored report.** Give a plain-English summary and rank the findings relevant to the selected role by potential harm. Assess financial, contractual, and operational exposure, including supported ambiguity, contradictions, and potentially harmful obligations. Each risk flag has a clear title, severity and its basis, exact supporting language with its location, why it matters to the selected role, and a practical next step or question. State the triggering condition where it matters. Cite each relevant passage for a contradiction. Use the same underlying agreement facts and supported interpretations for either role. Show only the selected perspective. For a clean result, say “No material flags found in the text reviewed” in the context of the selected role.
4. **Check for relevant missing protections.** Use the published checklist for deposit deductions and return, early-exit costs, rent changes, repairs, access, and dispute routes. Check related clauses and addenda before saying a protection was not found or a charge is uncapped. Report relevant absences as checklist items with a practical clarification question. The factual finding of whether a protection is present is independent of role. Exact quotations are required for risk flags, including any flag about ambiguous limits in an existing clause.
5. **Answer questions from the agreement. Removed from the beta.** The report no longer offers follow-up questions ("Ask about your agreement"). The `/api/questions` route stays in the codebase, unused. If Q&A returns, answers state only what the supplied text supports and say when the agreement does not answer a question.
6. **Apply optional personal red lines after the initial role-tailored review.** Provide an editable list and rerun preference matching within the original review role. Show preference matches separately from the role-based risk flags and preserve their severity.
7. **Draft an actionable proposed edit for each risk flag.** Address the selected role's exposure and aim for a compromise both parties could realistically accept. Show any risk that would remain. Reveal the draft through “See proposed edit” after the signer opens the flag's explanation.
8. **Let the signer return to a review.** Keep completed reviews in an authenticated library for 30 days from the review. An explicitly saved review stays for 90 days from the save, then is deleted. Show the expiry date so “save” cannot be mistaken for permanent storage.

## Release boundaries

- **V1 (Layer 1)** uses the complete agreement to detect contract risk and ambiguity. Its prompts, output checks, and copy explain that local law was not checked. V1 ships independently of legal verification. [ADR 0014](docs/adr/0014-layer-1-reads-the-lease-not-the-law.md).
- **V2 (Layer 2)** adds jurisdiction-aware legal context only when verified sources apply. Cite the sources supporting the assessment. For the same provision, jurisdiction, facts, and evidence, source applicability and supported legal interpretation stay consistent across roles. Use evidence-calibrated classifications such as “Potential legal conflict,” “Enforceability uncertain,” or “No specific conflict identified” when the verified review supports them. Use “Legal review unavailable” when the jurisdiction or applicable sources cannot be verified. “No specific conflict identified” describes the result of the verified review and does not establish lawfulness. Labels such as “illegal,” “legal,” or “unenforceable” require sufficient evidence.

**Risk severity** measures potential harm to the selected role. **Finding confidence** reflects how strongly the complete agreement supports the finding. **Legal status** reflects what verified, applicable legal evidence supports. A clause can pose a serious risk even when its legal status is unavailable. Explain uncertainty in the finding and distinguish it from the magnitude of the potential harm.

### Example

“Tenant shall pay a late fee of $100 per day until outstanding rent is paid.” Check the fee schedule, other clauses, and addenda for a cap or other limits before describing the exposure. A renter report can explain the accumulating cost and suggest asking for a capped or one-time fee. A landlord report can explain how a growing balance could lead to a dispute or make collection harder and suggest revising the fee structure. Discuss enforceability only where verified, applicable sources support the analysis in V2. Cite the same fee terms and limits in either review, and explain the basis for each role's severity.

## What good looks like

Test held-out residential lease packets for both roles. Include consequential deposit, early-exit, and dispute-rights terms, harmless oddities, clean leases, and missing referenced documents. Have independent reviewers mark consequential terms, role-specific severity, and source language before seeing Blueline's output. Require verifiable sources for every flag and no missed adjudicated high-severity term for either role. A citation mismatch or unsupported material claim fails the review. Count plausible warnings later found harmless as false alarms. Use paired runs on the same packet to check that contract facts agree and the reports differ substantively by role. [Acceptance criteria](.scratch/lease-review/spec.md#acceptance-criteria).

In the same test, a missing referenced document must prevent a review, a clean lease must not acquire an invented problem, and a missing checklist item must not masquerade as a cited flag. Q&A is removed from the beta, so the question checks apply only if it returns. Reviewers should be able to tell from each uncertain flag what event would make the risk real, rather than receiving either a vague hedge or a certain prediction. These checks test the trust claim; user satisfaction or willingness to pay alone does not.

The landing page gets one check of its own, separate from the citation tests above: an independent reviewer confirms it makes no claim the product doesn't support — no legal-validity, safe-to-sign, or outcome claim, and no invented testimonial, statistic, or case study.

## My red lines

These are the initial renter flag priorities. For a landlord review, assess the landlord's own exposure under the same provisions and other relevant terms. Apply the consequence-based severity scale to that exposure. A renter-side grading default does not carry over to the landlord report.

| Clause to inspect | Severity rule | Why it matters |
| --- | --- | --- |
| Deposit forfeiture or broad deductions | **High** if the text could cost the signer most or all of the deposit under a plausible circumstance; **medium** for a meaningful, bounded deduction; minor, clearly limited deductions need no warning. | The signer may lose money they expect to recover when moving out. |
| Early termination, reassignment, or penalty fees | **High** for a large or open-ended obligation that could change the decision to sign; **medium** for a meaningful fixed charge; minor charges need no warning. | A move or change in circumstances can become much more expensive than the advertised rent. The renter quote above gives a concrete reassignment-fee example, not a frequency estimate. |
| Waivers of dispute rights, including forced arbitration where the text says so | **High** if the stated waiver materially limits a way to contest a serious problem; **medium** when the agreement changes the process but the practical downside is bounded or uncertain. | A renter may learn only during a dispute that the agreement narrows the route for challenging the landlord. The analysis describes the document's terms; it does not declare whether a waiver is legally valid. |
| Automatic renewal or extension | **High** when missing a notice deadline commits the signer to another fixed term, or moves them to a higher or unknown rate, and that could change the decision to sign; **medium** for a meaningful but bounded renewal cost; **low** when the agreement simply continues period to period and can be ended on ordinary notice. A rolling month-to-month continuation is still flagged, because the signer should know the agreement does not end on its own. | A signer who misses a notice date can owe another term of rent, often at a rate set later, even after deciding to leave. |
| Unilateral changes to the agreement (a power to change terms, charges or obligations without the signer's agreement) | **High** by default, including a change that takes effect when a new version is posted, noticed or emailed, or that the signer accepts by carrying on. **Medium** only when the text bounds the power with clear limits: a stated cap on any increase, advance notice together with a right to leave without penalty, or a power limited to a narrow named subject. Notice alone or "reasonable" is not a limit. The explanation names what the clause lets change, how a change takes effect and which limits the text names or omits. Blueline has no Critical tier; a case a reviewer would call critical is graded High (decision 2, 2026-11-11). | The signer agrees to a price and duties that the other side can later rewrite, and may learn of the change only by continuing to use the service. |
| Small forfeitures (money paid for a period or service the signer won't get, or property left behind) | **Low** when the amount is small or bounded and the trigger is stated; higher only under the deposit, early-exit or any-other-term rows when the amount is large or open-ended. A small forfeiture that meets the materiality standard is flagged, not left out (decision 4, 2026-11-11). | The signer should know the money or property is not coming back, even when the sum is small. |
| Any other term with a plausible, material downside | Apply the same high/medium/low consequence rule; do not flag it just for being uncommon. | A closed list would miss a consequential rent change, repair obligation, access term, or other case-specific harm. The research is thinner for several of these categories, so the explanation must rest on the actual lease text. |

**Materiality (Option B, 2026-11-11).** A term earns a flag when it creates an obligation beyond the basic deal, a penalty or charge for leaving, changing or missing a step, the loss of a right, remedy, refund or option, or financial exposure that is large, open-ended or out of proportion. Ordinary payments are not flags: rent due on a stated day, a stated fee for a stated service, no refund for a period the signer has already had or can still use. A payment becomes a flag only when the text adds one of those downsides, such as forfeiting money for a period or service the signer won't get, or property left behind. A small forfeiture that meets this standard is flagged at Low, not left out. Whether a term deserves a flag and how severe it is are judged separately; severity weighs size, cap, duration, how plausible the trigger is, reversibility and housing stability, and a blank or unsupplied amount is reported, never guessed. `evals/reviewer-guide.md` applies the same standard for human reviewers.

Prefer a supported warning over missing a serious harm, while explaining the condition that makes the warning matter. A bounded fee can still matter greatly to an individual signer; general severity and personal preference remain separate.

## How we measure it

Between releases, a gold set of documents with known planted clauses is run through the same analysis the product uses (`npm run eval`, ticket 11; `npm run eval:gated` runs it through the completeness check too). Each run reports three numbers, each as a count and a percentage:

- **Recall.** How many planted clauses were found, out of the planted clauses whose type appears in "My red lines" above. Types not named there are listed as out of scope and never counted as misses. A clause counts as found when a flag quotes a sentence that overlaps it.
- **Groundedness.** How many flags quote a sentence that appears in the document character for character, out of all flags the model returned, including the ones the product dropped because the quote didn't match.
- **Clean documents.** How many flags come back on the documents that should come back clean.

A document whose model call fails is left out of every count, and the run says how many were left out. A failed call is never a miss.

The limit: a model wrote the gold set, and its documents are not leases. These numbers are an upper bound, never a promise to a reader, and they are not the independent evidence that "What good looks like" and ADR 0012 require before expansion. That is still ticket 09.

## The calls I made and what I gave up

| Choice | Chose against | Who is worse off because of it |
| --- | --- | --- |
| 1. Residential renters and landlords set the first version's priorities. | Equal focus on freelancers, new hires, and subscription users. | Those other signers wait for a product shaped around their contracts. |
| 2. Subscription and Terms of Service readers are explicitly out. | Serving the broadest pool of casual documents. | Someone trying to review a consumer subscription cannot use this version. |
| 3. Design for a signer with a near-term decision. | General education and post-dispute help. | People without a lease yet, and tenants already in a dispute, get little help. |
| 4. Start with money and dispute-rights clauses. | Flagging every unusual clause or fees alone. | A signer whose main problem is a less familiar clause may see it later or not at all. |
| 5. Rank by decision-changing consequence. | Making every flag high or using apparent illegality as the scale. | A renter for whom a bounded fee is personally devastating may see only a medium general severity. |
| 6. Require plausible material harm, even in common wording. | Treating novelty or supposed unenforceability as danger. | A signer curious about an odd but apparently harmless term may receive no warning. |
| 7. Favor catching serious harm over avoiding all false alarms. | A quieter report that misses more. | Signers with harmless terms spend time and worry checking extra warnings. |
| 8. State an uncertain risk with its triggering condition. | A generic hedge or a certain prediction. | Someone wanting a quick yes-or-no answer must read a conditional explanation. |
| 9. Give a neutral clean result. | Inventing minor warnings or saying “safe to sign.” | A signer seeking definitive reassurance does not get it. |
| 10. Stop when any referenced document is missing. | Partial analysis of an incomplete packet. | A signer under deadline may get no review until they obtain even a routine referenced document. |
| 11. Accept paste and selectable-text PDF. | DOCX upload or PDF-only input. | People with Word leases must paste the text; scanned-document users cannot use this version. |
| 12. Report absent protections as separate “not found” items. | Silence about absences or uncited risk flags. | Someone expecting one ranked list must interpret a second result type. |
| 13. Keep personal preference matches apart from general severity. | Letting a personal red line raise every reader's risk score. | A signer who wants one combined ranking must look at separate lists. |
| 14. Publish a fixed coverage checklist. | Letting the model invent expectations or relying only on user preferences. | Someone needing an uncommon protection may not see its absence reported. |
| 15. Choose a review role up front, then let signers add red lines after the report. | Requiring personal preferences before intake. | A rushed signer with a decisive personal concern must take a second step. |
| 16. Draft a plausible compromise. | Asking for maximum protection or only asking for clarification. | A signer who needs the strongest possible concession receives a narrower draft. |
| 17. Cover money terms and rights or remedies on the checklist. | Starting with only one category. | Signers of ordinary leases must read more “not found” items, some of little consequence to them. |
| 18. Put the proposed edit behind the flag explanation. | Showing it immediately or only in an export. | A signer looking for instant negotiation language has an extra step and may miss it. |
| 19. Keep automatic reviews for 30 days and explicitly saved ones for 90. | Permanent retention, 90 days for every review, or save-only retention. | Someone revisiting an older lease loses the review; a privacy-conscious signer has text stored for 30 days by default. |
| 20. Require independent trust evidence before expansion. | Expanding on satisfaction or willingness-to-pay signals. | People with other contract types wait longer, and the business still lacks proof of demand. |

## What we are not building

- **Other contract categories in the first version:** no Terms of Service or subscription review; freelance and employment agreements do not set its scope. The lease signer is the deliberate focus.
- **OCR, scanned PDFs, or DOCX upload:** uncertain extracted text would undermine exact-sentence citations, and the first parser supports paste and selectable-text PDF only.
- **A partial review of an incomplete agreement:** referenced documents can change the apparent cost or meaning of a term.
- **A legality or safe-to-sign verdict:** the product reports what the supplied agreement says and what could follow; it does not establish enforceability or guarantee that a lease is fine.
- **Payments, billing, or document sharing:** they do not test whether the analysis can be trusted and are outside the settled scope.
- **A permanent document archive:** automatic and explicitly saved reviews expire on the stated schedules.

## What the research could not tell us

- It did not measure how many lease signers read alone, use a free analyzer, hire a lawyer, or skip review. The renter quotes are warnings, not prevalence data; the Blind page containing the quote above was unavailable on recheck.
- Lawyer-review prices do not show what anyone would pay for this specific AI product. No direct willingness-to-pay quote for it was found ([pricing research](research/agent4-who-would-pay.md)).
- The search did not establish that no competitor combines these capabilities. It found existing consumer lease analyzers and did not verify a unique gap ([competitor research](research/agent3-what-already-exists.md)).
- It did not establish how often landlords accept drafted edits, how often lease packets omit referenced documents, or how accurate Blueline's analysis will be. Those are assumptions and test questions, not findings.
- Evidence is uneven across clause types. Deposit and dispute concerns have more support than rent escalation, indemnity, and some other categories; a published checklist is a product decision, not proof that every missing item is harmful ([clause research](research/agent2-what-goes-wrong.md)).
