# 26: Negotiation email draft

**What to build:** From a completed review, the signer picks which flags to raise (high and medium are ticked by default) and gets one email to the landlord. For each chosen flag, the email quotes the cited sentence and proposes that flag's counter-offer wording. The signer can copy it, open it in their mail app, or download it as text. Each flag's "Proposed edit" panel also gets a "Copy this request" button.

**Why:** LeaseGuard AI sells "AI Negotiation Templates" as a paid feature. Blueline already drafts a counter-offer for every flag (ADR 0010) and checks it against its residual risk (ADR 0013). What's missing is turning those drafts into something the signer can send. Assembling the email from verified fields means it can't introduce new claims. Source: `research/competitors/leaseguard-ai/05-implementation-blueprint.md`, feature 6.

**Blocked by:** none (uses clause headings from 25 if present)

**Status:** ready-for-agent

**Scope:** a new `src/features/negotiation/` folder (a pure `assembleNegotiationEmail` function, its tests and a `NegotiationDraft` component), wired into `ReviewResult.tsx` and the proposed-edit panel in `RiskFlagCard.tsx`. No model call, route, schema or migration change.

- [ ] `assembleNegotiationEmail(flags, {tone})` returns `{subject, body}` built only from fixed template wording plus each flag's `sourceSentence` and `counterOffer`, in `rankFlags` order, numbered
- [ ] Two tones, `plain` and `formal`. Both fixed templates go through the humanizer skill and pass `findLegalClaims`. The templates never mention law, rights, enforceability or deadlines, and never threaten.
- [ ] `residualRisk` is never put in the email, and nothing in it says the proposed wording removes the risk (ADR 0010)
- [ ] A flag whose counter-offer was withheld (`WITHHELD_TEXT.counterOffer`) is left out of the email, and the panel says which flags were skipped and why
- [ ] Placeholders for the landlord's name and the signer's name are left for the signer to fill in. No new fields are stored.
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
