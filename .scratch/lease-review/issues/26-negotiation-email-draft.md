# 26: Negotiation email draft

**What to build:** From a completed review, the signer picks which flags to raise (high and medium are ticked by default) and gets one email draft addressed to the other party. For each chosen flag, the email quotes the cited language and proposes that flag's counter-offer wording for the selected review role. The signer can copy it, open it in their mail app, or download it as text. The signer controls editing and sending. Each flag's "Proposed edit" panel also gets a "Copy this request" button.

**Why:** LeaseGuard AI sells "AI Negotiation Templates" as a paid feature. Blueline already drafts a counter-offer for every flag (ADR 0010) and checks it against its residual risk (ADR 0013). What's missing is turning those drafts into something the signer can send. Assembling the email from verified fields means it can't introduce new claims. Source: `research/competitors/leaseguard-ai/05-implementation-blueprint.md`, feature 6.

**Depends on:** the completed report's review role for recipient selection. Uses clause headings from 25 if present. [Review-role implementation](../spec.md#review-role-implementation).

**Status:** ready-for-agent

**Scope:** a new `src/features/negotiation/` folder (a pure `assembleNegotiationEmail` function, its tests and a `NegotiationDraft` component), wired into `ReviewResult.tsx` and the proposed-edit panel in `RiskFlagCard.tsx`. It reads the completed report and assembles the draft locally.

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
