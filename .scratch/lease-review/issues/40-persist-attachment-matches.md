# 40. Keep attachment matches when a saved report is reopened

Status: ready-for-agent
Stage: Next · Report evidence
Decision: approved for planning November 18, 2026. Begin implementation only when authorized.

Preserve which uploaded file was matched to an attachment reference in that review, so the saved report shows the same evidence as the report before saving.

## Acceptance criteria

- A saved report reopens with the matched attachment and the lease reference that it satisfies. An unmatched reference stays unmatched. Do not infer matches from file names on old reports.
- Match data belongs to its original review and follows the same ownership, expiry and deletion rules. Do not store the original PDF or make another model call.
- Reports saved before this change still open and list their saved files. Where a match was not saved, avoid presenting one as verified.
- Verify saving and reopening with synthetic fixtures for matched and unmatched references, same-name files, and a pre-change saved report.

See [BACKLOG.md](../../../BACKLOG.md) and the [release audit](../../../docs/handoff/beta-release-audit.md#reconciliation). This ticket and [page citations](39-pdf-page-citations.md) precede [printing](41-print-save-review-as-pdf.md).
