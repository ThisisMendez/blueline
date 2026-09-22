# 08: Review retention and expiry

**What to build:** A completed review stays in the signer's authenticated library for 30 days automatically, or 90 days from an explicit save action. The expiry date is visible in the library at all times. When a review expires, both the review and its stored extracted lease text are deleted — the library never quietly becomes a permanent archive.

**Blocked by:** 01 (needs a persisted, authenticated review to attach a lifecycle to)

**Status:** implemented and verified offline; deployed database and physical-deletion verification blocked on staging Supabase

- [x] A completed review is retained for 30 days from completion by default (controlled-clock/application verification)
- [x] A signer can explicitly save a review, extending its retention to 90 days from the save action (not from original completion) (controlled-clock/application verification)
- [x] The expiry date is visible to the signer in the library
- [ ] An expired review's record and its stored extracted text are both deleted, not just hidden
- [x] Deterministic test (clock controlled): a review at day 29 is present, at day 31 is gone (and its extracted text is gone) unless explicitly saved; an explicitly saved review at day 89 is present and at day 91 is gone

Evidence: clock-controlled deletion/save tests, owner-scoped route and real-client-boundary tests, library/save UI flows, failure states and persistence-failure fallback pass. Final typecheck, lint, 212 tests, offline smoke and production build pass. Migrations0005/0006 implement database-owned timestamps, atomic review creation, owner/expiry policies, revoked direct writes and a minute-based physical purge with cascading deletion. Static SQL review is complete; no SQL was executed. Mocks do not prove deployed RLS, transactions or deletion. README's retention deployment gate lists the required two-account and administrative checks. Retry count: 0; no independent implementation tickets blocked.
