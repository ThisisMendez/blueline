# 02: Selectable-text PDF input

**What to build:** A lease signer can provide a selectable-text PDF instead of pasted text and get the same reviewed result as ticket 01 — the PDF's text is extracted in the browser and fed through the same analysis path. A PDF with no usable selectable text (a scan or textless PDF) is rejected with a clear message explaining why, rather than silently producing an empty or misleading review.

**Blocked by:** 01 (needs the paste → cited-flags seam to plug PDF-extracted text into)

**Status:** ready-for-agent

- [ ] Signer can upload a selectable-text PDF and receive the same result shape as pasted text (summary + cited risk flags)
- [ ] Text extraction happens in the browser; only extracted text is sent onward and persisted, never the original file bytes
- [ ] A textless or scanned PDF is detected and rejected with an explanation, not silently reviewed
- [ ] Deterministic test: a selectable-text PDF fixture produces a review; a textless PDF fixture produces the rejection path, not a review
