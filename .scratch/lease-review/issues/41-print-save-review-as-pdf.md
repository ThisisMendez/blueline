# 41. Print or save a review as PDF from the browser

Status: ready-for-agent
Stage: Next · After report evidence
Blocked by: [39, PDF page citations](39-pdf-page-citations.md) and [40, saved attachment matches](40-persist-attachment-matches.md)
Decision: approved for planning November 18, 2026. Begin implementation only when authorized.

Provide a print action for the report the user can already view. Use the browser print dialog, which lets the user choose a printer or Save as PDF where supported.

## Acceptance criteria

- The printed report is legible across pages and includes its relevant findings, caveats and visible evidence, including page citations and attachment matches where available. Remove navigation and interactive controls from the print layout.
- Printing respects the same report access rules. The user chooses where to save or share the copy. No server-generated file, automatic email, new sharing link or additional service.
- Verify browser print preview for a guest report and a reopened saved report with synthetic fixtures. Check a long report for clipped sections and broken page breaks.

See [BACKLOG.md](../../../BACKLOG.md) and the [print design](../../../research/competitors/leaseguard-ai/05-implementation-blueprint.md#feature-8-downloadable-report-pdf).
