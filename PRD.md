# Blueline Redline — first-version brief

Blueline is the project shorthand. The official product name and visual direction are in [BRAND.md](BRAND.md).

## Who this is for

A renter with a residential lease or renewal in hand who must decide soon whether to sign. Blueline helps that person understand the agreement they were given, identify consequential terms, and consider a plausible proposed change before deciding. It is not designed around someone browsing contract advice or resolving a dispute after signing.

Today that person can read and compare the lease themselves, use a consumer lease analyzer, or pay for a lawyer's review. [ContractsCounsel currently lists an average $440 lawyer review for a rental lease on its platform](https://www.contractscounsel.com/b/rental-lease-agreement-cost); [the research found consumer lease analyzers](research/agent3-what-already-exists.md) but did not measure how many renters use any of these routes. Signing without a professional review is a plausible alternative, not a measured prevalence claim.

## The problem

The signer may notice the monthly rent yet miss a costly exit term, deposit condition, or change to how a dispute can be pursued. Terms can also sit in referenced schedules or rules outside the main lease. The product must make the consequence of a term visible **before** the signing decision and show the sentence behind every warning.

One renter in the research warned others: “don't accept being forced to pay 1k+ for lease reassignment regardless of who finds the new tenant” ([Blind discussion](https://www.teamblind.com/post/apartment-lease-red-flags-kghqkg5a), recorded in [the research notes](research/agent1-who-has-this-pain.md)). This supports treating an exit fee as a concrete concern; it does not establish how common that fee is. The original Blind page could not be reopened while drafting this brief, so the quote is traceable through the research notes rather than independently rechecked here.

## What the first version does

1. **Explain itself to the signer before asking for a lease.** A public, unauthenticated landing page states what Blueline Redline does — plain-English summary, cited risk flags, coverage checklist, document-grounded Q&A, counter-offers, a personal red-line list, a saved library — in the calm, precise, quietly defiant voice from BRAND.md, and its call to action is to sign in. It makes no legal-validity, safe-to-sign, or outcome claim the research doesn't support, and carries no testimonial, statistic, or case study the product hasn't earned. It states plainly that the product is free to use for this version, without implying that stays true later.
2. **Take a complete residential lease packet.** Allow anonymous analysis without persistence; only the library and personal red lines require an account (superseding the former sign-in prerequisite per the 2026-09-22 build instructions). Accept pasted text and PDFs with selectable text, including every document the lease references. Parse files in the browser and store only extracted text for signed-in signers. If any referenced document is missing, name what is missing and stop before producing even a partial review.
3. **Give a general review first.** Summarize the complete agreement in plain English and rank terms with plausible, material downsides. Every risk flag shows an exact sentence from the supplied text, the consequence, and the condition under which it would matter. Do not issue a flag without a matching sentence or treat unusual wording alone as harm. When no material risk is found, say “No material flags found in the text reviewed” and give a neutral summary, not a safe-to-sign verdict.
4. **Show coverage separately from risk.** Use a published checklist for deposit deductions and return, early-exit costs, how rent can change, repairs, access to the home, and dispute routes. Mark a checklist item “not found” when the complete packet does not state it. A missing item is neither a cited risk flag nor a claim that the lease is unlawful.
5. **Answer questions from the agreement.** Let the signer ask follow-up questions. Answers state only what the supplied text supports and say when the agreement does not answer a question.
6. **Let the signer personalize after the general review.** Provide an editable list of personal red lines and rerun the review when the signer changes them. Show terms that conflict with those preferences separately; personal importance does not change a term's general risk severity.
7. **Draft an actionable proposed edit for each risk flag.** Aim for a change a landlord might realistically accept, and show any risk that would remain. Reveal the draft through “See proposed edit” after the signer opens the flag's explanation.
8. **Let the signer return to a review.** Keep completed reviews in an authenticated library for 30 days from the review. An explicitly saved review stays for 90 days from the save, then is deleted. Show the expiry date so “save” cannot be mistaken for permanent storage.

## What good looks like

Test a held-out set of complete lease packets that includes consequential deposit, early-exit, and dispute-rights terms; harmless oddities; clean leases; and missing referenced documents. Have independent reviewers mark the consequential terms and their source sentences before seeing Blueline's output. Expansion beyond renters requires that they can verify the quoted source for every flag and that no adjudicated high-severity term in this set is missed. A citation mismatch or unsupported material claim fails the review; a plausible warning that turns out harmless is acceptable but must be counted as a false alarm.

In the same test, a missing referenced document must prevent a review, a clean lease must not acquire an invented problem, and a missing checklist item must not masquerade as a cited flag. Questions answerable from the packet must stay within its text; questions it cannot answer must say so. Reviewers should be able to tell from each uncertain flag what event would make the risk real, rather than receiving either a vague hedge or a certain prediction. These checks test the trust claim; user satisfaction or willingness to pay alone does not.

The landing page gets one check of its own, separate from the citation tests above: an independent reviewer confirms it makes no claim the product doesn't support — no legal-validity, safe-to-sign, or outcome claim, and no invented testimonial, statistic, or case study.

## My red lines

These are Blueline's initial flag priorities, not the signer's personal red lines. Severity depends on the consequence in the particular agreement, not on how rare the clause sounds or whether the model guesses it is enforceable.

| Clause to inspect | Severity rule | Why it matters |
| --- | --- | --- |
| Deposit forfeiture or broad deductions | **High** if the text could cost the signer most or all of the deposit under a plausible circumstance; **medium** for a meaningful, bounded deduction; minor, clearly limited deductions need no warning. | The signer may lose money they expect to recover when moving out. |
| Early termination, reassignment, or penalty fees | **High** for a large or open-ended obligation that could change the decision to sign; **medium** for a meaningful fixed charge; minor charges need no warning. | A move or change in circumstances can become much more expensive than the advertised rent. The renter quote above gives a concrete reassignment-fee example, not a frequency estimate. |
| Waivers of dispute rights, including forced arbitration where the text says so | **High** if the stated waiver materially limits a way to contest a serious problem; **medium** when the agreement changes the process but the practical downside is bounded or uncertain. | A renter may learn only during a dispute that the agreement narrows the route for challenging the landlord. The analysis describes the document's terms; it does not declare whether a waiver is legally valid. |
| Any other term with a plausible, material downside | Apply the same high/medium/low consequence rule; do not flag it just for being uncommon. | A closed list would miss a consequential rent change, repair obligation, access term, or other case-specific harm. The research is thinner for several of these categories, so the explanation must rest on the actual lease text. |

Prefer a supported warning over missing a serious harm, while explaining the condition that makes the warning matter. A bounded fee can still matter greatly to an individual signer; general severity and personal preference remain separate.

## The calls I made and what I gave up

| Choice | Chose against | Who is worse off because of it |
| --- | --- | --- |
| 1. Renters set the first version's priorities. | Equal focus on freelancers, new hires, and subscription users. | Those other signers wait for a product shaped around their contracts. |
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
| 15. Review first, then let signers add red lines and rerun. | Requiring preferences up front. | A rushed signer with a decisive personal concern must take a second step. |
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
