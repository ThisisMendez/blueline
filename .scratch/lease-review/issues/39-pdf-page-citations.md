# 39. Show where verified quotes appear in the PDF

Status: ready-for-agent
Stage: Next · Report evidence
Decision: approved for planning November 18, 2026. Begin implementation only when authorized.

Give users the source document and PDF page number or range for verified quotes. Use the page boundaries from browser extraction and the verified quote span. Count from the start of the PDF file, even if the printed pages use different numbering.

## Acceptance criteria

- A quote on one page shows that page. Quotes that cross a page break show their range. For repeated text, use the verified occurrence. If the occurrence cannot be resolved without guessing, keep the document citation only.
- New saved reports still show the same page information after reopening. Reports saved before this change keep their document citations. No rerun is needed to open them.
- The cited text, verification rules, findings and score do not change. Do not store the original PDF or add a model call.
- Verify single-page and cross-page quotes, multiple PDFs, repeated text, and old saved reports with synthetic fixtures.

See [BACKLOG.md](../../../BACKLOG.md) and the [release audit](../../../docs/handoff/beta-release-audit.md#reconciliation). This ticket and [saved attachment matches](40-persist-attachment-matches.md) precede [printing](41-print-save-review-as-pdf.md).
