# Blueline project document review checklist

Use this checklist to review Blueline briefs, specs, research summaries, and design documents. It is separate from the lease-protection coverage checklist that Blueline Redline shows to signers. Score every item **pass** or **fail**. If an item's condition does not apply, it passes with an explanation; if the document lacks evidence needed to judge it, it fails until that evidence is supplied.

| ID | Check | Pass when |
| --- | --- | --- |
| 1 | **Name** | Any public-facing product name is **Blueline Redline**. “Blueline” is used only as the project shorthand. ([Brand](../BRAND.md)) |
| 2 | **First-version audience and scope** | Any first-version proposal serves a lease signer with a residential lease or renewal in hand. Other contract categories are clearly labeled as future possibilities, not current requirements. ([Brief](../PRD.md)) |
| 3 | **Evidence** | Factual claims about users, competitors, prices, or legal effects point to a source. Claims without support are labeled as assumptions or questions, not findings. ([Research](../research/summary.md), [brief](../PRD.md)) |
| 4 | **Domain language** | Terms such as risk flag, severity, not-found item, preference match, complete agreement, and counter-offer are used as defined in [CONTEXT.md](../CONTEXT.md). |
| 5 | **Decision consistency** | A proposed behavior agrees with the relevant [ADRs](adr/) and [brief](../PRD.md), or identifies the decision it would change and explains why. It does not silently treat an open question as settled. |
| 6 | **Testable requirements** | When the document specifies product behavior, it states observable outcomes or acceptance conditions. A reviewer can tell what would count as working, failing, or being blocked. ([“What good looks like”](../PRD.md#what-good-looks-like)) |
| 7 | **Grounded analysis** | When the document describes lease analysis, it requires each risk flag to show an exact source sentence and a plausible consequence. Any example flag supplies that sentence. Not-found items and personal preference matches stay distinct from risk flags, and the document does not promise a legality or safe-to-sign verdict. ([Brief](../PRD.md), [citation decision](adr/0001-every-flag-cites-its-source.md)) |
| 8 | **Brand direction** | When the document specifies product copy, its tone is calm, precise, and editorial. When it specifies visuals, it uses Blueprint navy `#123B5D`, Paper `#F6F1E7`, and Signal red `#E5453A`, reserving red for consequential terms and credible proposed changes. ([Brand](../BRAND.md)) |
| 9 | **Open questions** | Missing inputs, unresolved choices, and unverified assumptions that affect the proposal are named with their consequence. The document does not present them as completed work. |
