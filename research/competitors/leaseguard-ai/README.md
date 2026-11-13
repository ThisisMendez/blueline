# LeaseGuard AI research

Research date: 12 November 2026. Target: <https://leaseguardai.com/>. Purpose: learn how LeaseGuard AI's 12 advertised features behave in public, and plan how Blue Line could build equivalent features of its own.

This folder is research only. No Blue Line application code, configuration, dependency or migration was changed.

## Files

| File | What it holds |
|---|---|
| [05-implementation-blueprint.md](05-implementation-blueprint.md) | **The main deliverable.** For all 12 features: what was observed, the evidence, the Blue Line architecture, schemas and prompts, how it fits the existing code, dependencies and tests, edge cases, and a build sequence. |
| [01-feature-inventory.md](01-feature-inventory.md) | What each of the 12 features is, where it appears, and how far it was verified. |
| [02-user-journey.md](02-user-journey.md) | The public journey from landing page to sample report, with screenshots. |
| [03-rea-evidence.md](03-rea-evidence.md) | How REA was run, its Evidence IDs, and the third-party origins each page contacted. |
| [04-availability-and-paywall.md](04-availability-and-paywall.md) | Which tier unlocks what, and which features are only advertised or "coming soon". |
| `evidence/rea/` | REA Evidence records (`*.evidence.json`), condensed summaries (`*.summary.json`) and accessibility-tree text (`*.ax.txt`). |
| `evidence/scenarios/` | The exact REA scenario inputs, so every capture can be rerun. |
| `evidence/html/`, `evidence/text/` | Server-rendered HTML for five pages and its extracted text. These hold the collapsed FAQ answers. |
| `screenshots/` | Browser screenshots at 1440 px wide, one per captured page. |

## Verification levels used throughout

- **Observed working**: REA captured the output rendered on the page. The only output observed this way is the public sample report at `/analyze?demo=true`, which the site labels as "an example using a fictional lease". It shows what an output looks like, not that the analyzer produces it for a real lease.
- **Visible**: the control or label is on the page, but its result was not exercised.
- **Advertised**: described in marketing, pricing or FAQ text only.
- **Inaccessible**: sits behind payment, an account or a bot check, so it wasn't exercised.

None of the 12 features was observed running on a real lease. The reasons are under Boundaries.

## Boundaries kept

- **No lease was uploaded.** LeaseGuard's terms (section 3) allow analysis only of "lease agreements to which you are or may become a party", and `/analyze` loads a Cloudflare Turnstile bot check (origin `challenges.cloudflare.com` in the `analyze` Evidence). Uploading a made-up lease through an automated browser would break the first and run into the second. If you want first-hand output, you can analyze a lease you are actually a party to through your own browser and add the result here.
- **No payment, account creation or sign-in.**
- **No bundle analysis or source-map recovery.** The terms forbid trying to "extract, reverse-engineer, or reproduce our AI models or legal database". REA's `analyze-web-bundle` was therefore not run. Only rendered page content, screenshots and request origins were captured, with no request or response bodies and no header values.
- **No crawl.** 17 pages were captured one at a time, out of a sitemap of about 150 URLs: every product and legal page, the account page, the sample report, one state guide and three blog posts about LeaseGuard itself.
- **Blurred content stayed blurred.** The sample report blurs the explanations for its three locked flags. Those explanations were not read out of the DOM.
- **Nothing here describes LeaseGuard's backend.** Anything about how its server works is LeaseGuard's own published claim (for example, the trust page names "GPT-4o (OpenAI)"), not something we observed. The Blue Line design in the blueprint is our own.

## LeaseGuard legal text must not be reused

The sample report and features page cite Florida statutes (for example F.S. 83.49(3), 83.808, 83.53 and 83.48) and state legal rules. **None of these statements was checked**, and Blue Line must not copy them into prompts, fixtures or reference data. Feature 4 in the blueprint describes how Blue Line would build and review its own statute data.
