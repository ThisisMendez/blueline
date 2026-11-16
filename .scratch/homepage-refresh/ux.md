# Homepage browser verification

The local fixture builds compared launch main at 468615c69b9d1de03c07aa4810bac96c00315008 on port 34951 and the integrated candidate at c733f491fa02bf93373e94b09f058c0e88693d13 on port 34952. Chrome 157.0.8103.80 ran headless in isolated disposable profiles. The servers listened only on 127.0.0.1 and used the deterministic synthetic model with accounts disabled. Both builds used the tracked Next.js font configuration and self-hosted Archivo, Source Serif 4, and JetBrains Mono via the ordinary build-time download.

## Homepage and keyboard

- The three browser sizes preserved the six palette tokens, existing visible homepage copy, link paths, accessible names, and heading sequence. The candidate added the H4 and static HTML renter example under Sample reports. Its caption, High severity, exact Maple Court quote, and consequence matched the sample report.
- Chromium’s accessibility tree exposed one main landmark, one H1, and both named sample links in order after the two hero actions. The descriptive subtitles were part of their names and the arrows were absent from the names. The empty-alt masthead and decorative imagery and the hidden coverage icons added no image announcements. The six checklist labels retained their published homepage order.
- Using Tab and Enter at desktop and phone widths, the skip link became visible, the candidate focused main, and the next Tab moved to Review a lease. The baseline reached the main fragment but left focus on body. Both hero actions activated from the keyboard. The sample jump focused the named region, then the next Tab reached the renter card, followed by the landlord card. Both cards received a visible 2px outline with a 3px offset. The mobile keyboard opened Menu, traversed its controls, dismissed it with Escape and returned focus to Menu, then followed a shared-header link and confirmed the menu closed.
- Checked 320, 360, 390, 639, 640, 641, 767, 768, 769, 1023, 1024, 1025, and 1440 CSS px. The viewport and document scroll widths agreed with no overflowing content. At a configured desktop window of 1280 × 1024, changing the isolated Chrome profile’s native Appearance → Page zoom setting to 200% changed the effective layout from 1280 × 1024 to 640 × 512 and reported DPR 2. The 12px desktop scrollbar left 628 CSS px of content width. Both builds reflowed without horizontal scrolling, at visual viewport scale 1.

## Contrast and image failure

At DPR 1 and 1440 × 1000, 768 × 1024, and 390 × 844, sampled every background pixel in each rendered text word’s bounding box with only text and the card arrow temporarily made transparent. This preserves the actual render of the photograph, crop, and gradient scrim and gives a conservative low point over the text areas. Repeated in the default, hover, and keyboard focus states. The focus indicator and border ratios use their rendered colors against the adjacent Paper Deep.

| Minimum contrast | Desktop | Tablet | Phone |
| --- | ---: | ---: | ---: |
| Renter card text | 9.48:1 | 9.32:1 | 9.33:1 |
| Landlord card text | 8.73:1 | 8.91:1 | 8.85:1 |
| Card arrow, either role | 8.48:1 | 9.19:1 | 9.15:1 |
| Card border against surround | 9.11:1 | 9.11:1 | 9.11:1 |
| Focus ring against surround | 4.34:1 | 4.34:1 | 4.34:1 |

The 12px explicit severity badge uses Paper on Red Ink at 4.91:1. The hero actions’ final Signal Red focus ring against the Paper around them is 3.56:1.

The browser blocked the new decorative image requests at desktop and phone widths. The hero and cards retained their reserved space, and the excerpt stayed readable. The photo cards fell back to Navy Ink with 12.70:1 minimum sampled text contrast. Browsing still worked from the hero to the sample section, through both sample links, and through Review a lease to role selection.

## Sample reports and synthetic intake

- Both sample links opened their own role and named the correct perspective as current. Each role exposed its fictional lease, a role-specific citation, a working explanation and proposed edit with residual risk, and the coverage status “Not found in the text reviewed” for omitted topics. The opposite perspective link switched the page and current role.
- In the renter sample, selected the early-exit issue, generated the email, and edited it. In the landlord sample, opened the repair recommendation, opened its proposed wording, and edited it. The app’s Copy draft control reported success and submitted the exact edited text to a browser-local clipboard spy. The system clipboard was outside this check.
- On both builds, followed the real Review a lease action, checked the role gate and pressed state, and supplied the repository’s selectable-text synthetic adhesion-lease PDF through the browser file picker input. In each role the browser read the PDF, moved to processing, and opened a guest report with the selected role. Each flow sent exactly one successful analysis request with that role, title, and 11,024 characters of extracted text. The report showed six expected coverage topics in order, all with Found status. The six coverage quotes and nine flag quotes were verbatim substrings of the browser’s extracted PDF text and matched the fixture sidecar after collapsing PDF line breaks to spaces. The fixture returns the same planted risk findings for this document in both roles. The browser trace contained only loopback app requests.

## Cold mobile performance

Three visits each, alternating before and after. Every measured navigation used a fresh Chrome profile with normal HTTP caching and service workers bypassed. The Next image optimizer was warmed for the tested variants before sampling. Chrome mobile viewport 390 × 844 at DPR 2, 4× CPU slowdown, 80 ms latency, 200,000 B/s downstream and 93,750 B/s upstream. Recorded the last observed LCP and maximum Web Vitals layout-shift session over the first seven seconds with no scrolling. Transfer bytes are Resource Timing transfer sizes, including response overhead. This is a loopback comparison.

| Metric | Before | Candidate |
| --- | ---: | ---: |
| LCP runs, ms | 1048, 988, 1044 | 1620, 1620, 1572 |
| Median LCP | 1.044 s | 1.620 s |
| LCP element | Paragraph | Spotter hero image |
| CLS, every run | 0 | 0 |
| Image bytes transferred | 2,350 B | 123,498 B |
| New image bytes transferred | 0 B | 121,148 B (118.3 KiB) |

The additional 576 ms is time to paint the larger hero artwork. An earlier paragraph still painted at 768 ms in the median candidate run. The requested mobile variants included the 750w hero at 61,638 B, 640w renter photo at 31,274 B, and 640w landlord photo at 28,236 B. The cameo stayed out of the initial mobile waterfall. The fully loaded DPR 1 desktop used a 640w hero at 49,846 B, the same two 640w photos, and a 256w cameo at 16,962 B, measured per variant. The candidate met the 2.5 s LCP, 0.1 CLS, and 350 KiB new-mobile-image targets, as well as the per-asset targets.

The separately saved DevTools cache-disabled stress run forced three transfers of the same hero URL and posted a 2.500 s median. Normal-cache cold profiles transferred that URL once, with later references reusing it.

## Evidence

- Full-page before and after at 1440 × 1000, 768 × 1024, and 390 × 844, captured at DPR 1. [Before desktop](evidence/before-desktop.png) · [After desktop](evidence/after-desktop.png) · [Before tablet](evidence/before-tablet.png) · [After tablet](evidence/after-tablet.png) · [Before mobile](evidence/before-mobile.png) · [After mobile](evidence/after-mobile.png)
- [320px](evidence/after-320.png) · [200% zoom](evidence/after-zoom-200.png) · [Sample focus](evidence/after-mobile-sample-focus.png) · [Desktop with image failures](evidence/after-desktop-images-blocked.png) · [Mobile with image failures](evidence/after-mobile-images-blocked.png)
- [Renter draft](evidence/after-sample-renter-draft.png) · [Landlord draft](evidence/after-sample-landlord-draft.png) · [Renter fixture report](evidence/after-intake-renter-report.png) · [Landlord fixture report](evidence/after-intake-landlord-report.png)
- [Baseline check output](evidence/before-all-ux.json) · [Candidate check output](evidence/after-all-ux.json) · [Candidate mobile AX tree](evidence/after-mobile-ax.json) · [Cold vitals and waterfall](evidence/cold-mobile-vitals.json) · [Cache-disabled stress run](evidence/cache-disabled-mobile-stress.json)

Verification used Chromium accessibility data and keyboard events. Screen-reader speech, other browser engines, hosted performance, real model behavior, hosted authentication, and persistence remain unverified.
