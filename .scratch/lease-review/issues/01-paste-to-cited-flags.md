# 01: Paste a lease, get cited risk flags

**What to build:** A lease signer pastes lease text, anonymously or signed in, and receives a plain-English summary and ranked risk flags. Each risk flag shows severity, a concrete plausible consequence, the triggering condition where uncertainty matters, and the exact source sentence it came from — verified verbatim against the extracted text before it is ever shown. The model is called server-side through OpenRouter, with the model id read from a single environment variable, never hardcoded. Only extracted text is persisted, scoped to the authenticated signer, and the review is still there on reload. Anonymous reviews are ephemeral. A clean review (no material flags) says so plainly, without implying the lease is safe to sign.

This ticket establishes the one full-stack seam — paste in, gated analysis, cited output, persistence — that every later ticket extends rather than rebuilding.

**Blocked by:** None (can start immediately)

**Status:** implemented and verified offline; live pipeline verified; hosted auth/database verification pending

2026-09-22 requirement correction: analysis also works anonymously with or without configured Supabase. Anonymous reviews are never persisted; only the library and personal red lines require an account. Signed-in persistence and isolation criteria remain unchanged.

- [ ] Signer can sign in and paste lease text (implemented; hosted sign-in unverified)
- [x] Server route calls OpenRouter using a model id read from one environment variable; no model id is hardcoded anywhere
- [x] Original pasted content is not stored as a file; only extracted text is persisted
- [x] Response includes a plain-English summary and a list of risk flags ranked by severity
- [x] Each risk flag includes: severity, concrete consequence, triggering condition, exact source sentence, source document identifier
- [x] A risk flag whose quoted sentence does not match the extracted text verbatim is retried or dropped — never shown
- [x] A lease with no material risk flags returns a clean-review result, not silence and not a safe-to-sign claim
- [ ] The review persists and is visible again after reload, scoped to the authenticated signer only (client-boundary tests pass; deployed database isolation unverified)
- [x] Deterministic test: given a stubbed/fixed model response, the full paste → flags → persisted → reload path is exercised without a live model call

Final evidence: 212 deterministic tests pass across the application. One bounded live synthetic smoke returned 9 flags, verified 9, dropped 0, with no provider errors. This proves transport/schema/citation behavior, not semantic quality: severity, venue coverage and one draft/residual consistency concern remain for independent evaluation. See BUILD-REPORT.md. No hosted Supabase project was created or migrations applied.
