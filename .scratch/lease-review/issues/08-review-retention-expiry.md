# 08: Review retention and expiry

**What to build:** A completed review stays in the signer's authenticated library for 30 days automatically, or 90 days from an explicit save action. The expiry date is visible in the library at all times. When a review expires, both the review and its stored extracted lease text are deleted — the library never quietly becomes a permanent archive.

**Blocked by:** 01 (needs a persisted, authenticated review to attach a lifecycle to)

**Status:** ready-for-agent

- [ ] A completed review is retained for 30 days from completion by default
- [ ] A signer can explicitly save a review, extending its retention to 90 days from the save action (not from original completion)
- [ ] The expiry date is visible to the signer in the library
- [ ] An expired review's record and its stored extracted text are both deleted, not just hidden
- [ ] Deterministic test (clock controlled): a review at day 29 is present, at day 31 is gone (and its extracted text is gone) unless explicitly saved; an explicitly saved review at day 89 is present and at day 91 is gone
