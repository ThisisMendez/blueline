# 26: Negotiation email draft

Status: ready-for-agent

**What to build:** From a completed review, the signer picks which flags to raise and gets one email draft addressed to the other party. For each chosen flag, the email quotes the cited language and proposes that flag's counter-offer wording for the selected review role. The signer controls editing and sending. The next beta release starts with the renter selection and copy flow below.

**Why:** LeaseGuard AI sells "AI Negotiation Templates" as a paid feature. Blueline already drafts a counter-offer for every flag (ADR 0010) and checks it against its residual risk (ADR 0013). What's missing is turning those drafts into something the signer can send. Assembling the email from verified fields means it can't introduce new claims. Source: `research/competitors/leaseguard-ai/05-implementation-blueprint.md`, feature 6.

**Depends on:** the completed report's review role for recipient selection. Uses clause headings from 25 if present. [Review-role implementation](../spec.md#review-role-implementation).

**Live baseline:** The report shows up to three verified High or Medium findings with usable proposed wording. Renters can edit and copy a message for each finding. Landlords can edit and copy a proposed clarification. The combined draft and drafting sign-in gate are pending. Release them with the [return-to-report flow](30-save-after-guest-review.md).

## Next beta release

- Show the cited renter shortlist first. Let renters select one item, select a subset, or use **Select all** to include all available items. Start with no items selected. Use one selection model for all three choices.
- Require sign-in when a renter chooses **Create email draft** or a landlord chooses to draft, revise, or copy replacement wording through a drafting tool. Keep findings, quotes, explanations, and the selection controls available to guests. Cover alternate drafting entry points as well.
- After sign-in, return to the selected action. For renters, build one editable draft from the selected items in report order, including each exact quote and its suggested change. Keep drafts in the tab and generate them locally. Copying is an explicit action. Sending stays with the renter.
- If a renter changes the selection after editing, keep their draft until they explicitly choose to update it. Cover the empty, one-item, and all-items cases and verify there are no extra model calls. Keep signed-in drafting free during beta and record it as a possible paid feature later. Revisit full-lease drafting, tones, download, and mail-app handoff separately.

Reuse the existing `src/features/negotiation/` code and report entry points. Assemble the message from verified quotes and available proposed wording. Skip withheld wording and explain why. The draft should give the renter something concrete to ask for and leave the sending decision with them.

## Later expansion

The original checklist below covers the broader negotiation toolkit. Treat it as follow-up scope. The current release uses the selection and sign-in flow above.

- [ ] `assembleNegotiationEmail(flags, {tone, role})` returns `{subject, body}` built from the role's fixed template wording and each flag's verified source language and counter-offer, numbered in report order
- [ ] Two tones, `plain` and `formal`. Both fixed templates go through the humanizer skill and pass `findLegalClaims`. The templates never mention law, rights, enforceability or deadlines, and never threaten.
- [ ] `residualRisk` is never put in the email, and nothing in it says the proposed wording removes the risk (ADR 0010)
- [ ] A flag whose counter-offer was withheld (`WITHHELD_TEXT.counterOffer`) is left out of the email, and the panel says which flags were skipped and why
- [ ] Recipient and sender placeholders follow the review role. The renter draft addresses the landlord, and the landlord draft addresses the renter. The signer fills in the names.
- [ ] Copy uses the clipboard API, with a visible confirmation. The `mailto:` link is offered only when the encoded URL is under 1,800 characters; otherwise only Copy and Download are shown. Download produces a `.txt` file.
- [ ] Zero flags selected, or a clean review: no draft, and a short message instead
- [ ] The draft is labelled as text for the signer to edit before sending
- [ ] Ticked flags may be remembered per review in `localStorage`, wrapped in try/catch. Nothing is stored server-side.
- [ ] Tests:
  - assembly order and numbering
  - quoting of sentences that contain quotation marks
  - the withheld counter-offer is skipped
  - both tones pass `findLegalClaims`
  - the `mailto` length cut-off
  - a component test of select, copy and download
- [ ] `npm run typecheck`, `npm test` and `npm run build` pass

**Not in this ticket:** a model "polish" pass on the email (blueprint feature 6, optional). Add it only if signers find the assembled draft stiff, and only with a check that every quote and counter-offer appears in the output exactly as written.
