# Feature inventory: what was verified

Status key: **Observed (sample)** = the output was rendered in the fictional public sample report and captured by REA. **Visible** = the control is on the page but wasn't exercised. **Advertised** = described in text only. **Inaccessible** = behind payment, an account or a bot check. Evidence IDs are listed in [03-rea-evidence.md](03-rea-evidence.md).

No feature was observed running on a real lease (see the README's Boundaries section).

| # | Feature | Where it appears | Status | Tier |
|---|---|---|---|---|
| 1 | Lease Health Score (A–F) | Home "Your lease gets a grade" section; sample report; pricing | **Observed (sample)**: `C 62/100` | Free |
| 2 | Clause-by-clause risk detection | Features modules; how-it-works; sample report | **Observed (sample)**: "26 clauses reviewed · 8 issues found" | Free (top 5), Pro (all) |
| 3 | Junk fee detection | Features "Junk Fee Scanner"; home | Advertised; one fee flag is in the sample (locked) | Free/Pro |
| 4 | State-specific legal references | State selector on `/analyze`; sample flags; `/tenant-rights/<state>` | **Observed (sample)**: statute chips like `F.S. 83.49(3)` and a "Florida — Key Tenant Rights (Free)" box | Citations: Pro |
| 5 | Plain-English explanations | Features "Plain-English Statute Explanations"; sample | **Observed (sample)**: "Why It Matters" and "Recommended Action" blocks | Free "Basic", Pro "Full" |
| 6 | Negotiation email templates | Features "AI Negotiation Templates"; pricing | Advertised (one example template); quoted template lines inside sample actions | Pro |
| 7 | Risk severity prioritization | Sample report; analyze page; pricing | **Observed (sample)**: HIGH/MEDIUM/LOW badges sorted high first, with a count line | Free (levels); Pro "Severity scoring per clause" |
| 8 | Downloadable PDF reports | Pricing; how-it-works "PDF Report (Pro)"; sample paywall | Advertised; inaccessible | Pro / one-time |
| 9 | Original vs revised lease comparison | Pricing only: "Lease comparison (draft vs. revised)" | Advertised; no UI seen | Pro |
| 10 | Multi-property dashboard | Pricing only | Advertised; no UI seen | Premium |
| 11 | Co-tenant report sharing | Pricing only: "Co-tenant access (share reports)" | Advertised; no UI seen | Premium |
| 12 | Deposit Shield | Pricing: "Deposit Shield (coming soon)"; pricing FAQ | Advertised **as not yet built** | Premium (future) |

## Detail per feature

### 1. Lease Health Score (A–F)
- **Output seen:** a circular gauge showing `C` and `62/100`, next to the headline "Found 8 issues total — including 1 HIGH-risk clause that could put your deposit or rights at risk. Review before signing." (`sample-report` Evidence, `screenshots/sample-report.png`).
- **Scale as published (home page):** A = "Safe to sign / Clean lease. Sign with confidence", then "Minor issues. Clarify before signing" (Low risk), "Notable risks. Negotiate these terms" (Negotiable), "Multiple high-risk flags. Strongly consider consulting a tenant-rights attorney" (High risk), and F = "Predatory. We recommend not signing as-is."
- **Stated method (how-it-works):** "Risk scoring per clause (0–100)" and "Aggregated Lease Health Score calculation". The formula isn't published, and one sample can't establish it.
- **Unknowns:** the score-to-letter thresholds, and whether the score is set by the model or by rules.

### 2. Clause-by-clause risk detection
- **Output seen:** each flag card shows a severity badge, a title, the clause in quotes, "Why It Matters", "Recommended Action" and a statute chip. The first flag also carries a `MAY NOT BE ENFORCEABLE` badge.
- **Stated method:** three "pipelines" (statute cross-reference, fee analysis, predatory language) feeding six "modules".
- **Unknowns:** how clauses are split. We also can't tell whether the quoted clause is checked against the uploaded text. The sample quotes come from a fictional lease that isn't shown, so verbatim accuracy can't be tested.

### 3. Junk fee detection
- **Advertised targets:** admin fees stacked on deposits, move-in/out fees that duplicate deposit coverage, amenity fees, utility markups, stacked pet fees and deposits, and late fees above state limits (features page).
- **Sample:** "Mandatory Carpet-Cleaning Fee Regardless of Condition" (LOW, locked).
- **Stated method:** "identifying every monetary charge and benchmarking it against state caps and market norms." The market-norm data isn't visible.

### 4. State-specific legal references
- **Input:** a required "1. Select Your State" dropdown on `/analyze`, defaulting to Florida, with "⭐ = enhanced statute coverage".
- **Output seen:** statute chips on flags, and a free box listing the state's deposit limit and notice period.
- **Content claims:** "Statute database is updated quarterly" (how-it-works and terms). The sources listed are state landlord-tenant acts, HUD, CFPB junk-fee guidance, case law and AG actions. **None of the legal statements was checked.**

### 5. Plain-English explanations
- **Structure (features page):** "what the clause says, why it raised a flag, which statute it references, and suggested next steps." The sample shows this as clause quote, then Why It Matters, then Recommended Action, then statute chip.

### 6. Negotiation email templates
- **Advertised:** "Templates for every medium and high-risk flag", email drafts and in-person conversation starters.
- **Example (features page):** "Thank you for sending the lease. I noticed Section 12 includes a $350 administrative fee. I'd like to understand what this covers and request it be removed or applied toward the security deposit before I sign…"
- **Inaccessible:** the full per-flag templates are Pro only.

### 7. Risk severity prioritization
- **Output seen:** three levels, high first, plus "We found 8 flagged clauses in your lease — 1 high-risk, 4 medium-risk, 3 low-risk." The free preview shows the top 5 flags; the remaining 3 are listed with title and quote, and their explanations are blurred and locked.
- **Pro adds** "Severity scoring per clause", which suggests the 0–100 per-clause score is shown. Not verified.

### 8. Downloadable PDF reports
- Advertised as "A branded, printable report you can share with your attorney or housing advocate", also delivered by email after payment. The paywall's email field is visible. Wasn't exercised.

### 9. Original vs revised lease comparison
- Only the pricing line "Lease comparison (draft vs. revised)" and its comparison-table row. No UI, sample or description was found.

### 10. Multi-property dashboard
- Only pricing lines. The Premium audience is "renters managing multiple properties or high-value leases". `/account` is a sign-in form ("Sign in to access your lease analysis history"). The dashboard itself is behind an account.

### 11. Co-tenant report sharing
- Only pricing lines. No sharing UI was found.

### 12. Deposit Shield
- The pricing FAQ calls it "an upcoming Premium feature that helps you document your unit condition at move-in, track landlord communications, and build a record that supports deposit return disputes. It's currently in development." **It doesn't exist on LeaseGuard yet**, so anything Blue Line builds here is our own design.
