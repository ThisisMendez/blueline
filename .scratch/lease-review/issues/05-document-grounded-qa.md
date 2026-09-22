# 05: Document-grounded Q&A

**What to build:** A lease signer can ask a follow-up question about their complete agreement and get an answer grounded only in that agreement's text. When the text doesn't support an answer, Blueline says so explicitly rather than filling the gap with outside legal knowledge presented as if it were a term of the lease.

**Blocked by:** 03 (the question box answers from "the complete agreement," which only exists once completeness gating is in place)

**Status:** verified offline; live relevance remains part of independent evaluation

- [x] Signer can ask a free-text question about their complete agreement after review
- [x] Answers are grounded in the agreement's extracted text, not outside knowledge
- [x] An unanswerable question (text doesn't support an answer) gets an explicit "not addressed" response, not a fabricated one
- [x] No answer states an outside legal rule as though it were a term of the signer's lease
- [x] Deterministic test: an answerable question against fixture text returns a grounded answer; an unanswerable question returns the explicit non-answer, not a guess

Evidence: 11 Q&A route/full-flow tests exercise actual parsing, completeness, exact citation verification, addendum answers and failed retry handling. Full suite: 172 tests; typecheck and lint pass. Answers are deliberately extractive: only verified source slices are displayed, with document and offsets; free-form outside prose is rejected.
