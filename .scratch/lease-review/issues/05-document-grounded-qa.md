# 05: Document-grounded Q&A

**What to build:** A lease signer can ask a follow-up question about their complete agreement and get an answer grounded only in that agreement's text. When the text doesn't support an answer, Blueline says so explicitly rather than filling the gap with outside legal knowledge presented as if it were a term of the lease.

**Blocked by:** 03 (the question box answers from "the complete agreement," which only exists once completeness gating is in place)

**Status:** ready-for-agent

- [ ] Signer can ask a free-text question about their complete agreement after review
- [ ] Answers are grounded in the agreement's extracted text, not outside knowledge
- [ ] An unanswerable question (text doesn't support an answer) gets an explicit "not addressed" response, not a fabricated one
- [ ] No answer states an outside legal rule as though it were a term of the signer's lease
- [ ] Deterministic test: an answerable question against fixture text returns a grounded answer; an unanswerable question returns the explicit non-answer, not a guess
