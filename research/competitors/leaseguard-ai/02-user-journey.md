# Public user journey

All screenshots are 1440 px wide, captured by REA with a disposable browser profile owned by REA.

## Navigation

The top bar reads: How It Works · Features · Pricing · Blog · Contact · My Account ("Save reports · optional") · **Analyze My Lease** (the main button). The footer links Tenant Rights by State, About, Share Feedback (`/feedback`), Trust & Transparency, Privacy and Terms. Almost every section ends in a call to action pointing at `/analyze`.

## Journey

1. **Landing** (`screenshots/home.png`). Headline promise, the A–F grade scale, a three-step explainer, beta-tester quotes, a "LeaseGuard AI vs. Sign Blind vs. Attorney ($400–$800+)" table and an FAQ.
2. **Features / How it works** (`features.png`, `how-it-works.png`). Six modules and three pipelines. Upload limits: PDF up to 25 pages, "OCR-enhanced" scanned PDFs, pasted text and multi-addenda packages. "Under 60 seconds", or under 3 minutes for long leases.
3. **Analyze** (`analyze.png`). A free vs Pro comparison at the top, then **1. Select Your State** (dropdown) and **2. Upload Your Lease (PDF or TXT)** (dropzone: "PDF or TXT · Up to 25 pages"), then "Analyze My Lease Now". It says "you'll see your Health Score first, then your top flags." A Cloudflare Turnstile check loads on this page. No account is needed.
4. **Report**, seen only as the sample (`sample-report.png`, `/analyze?demo=true`). From top to bottom:
   - a banner: "SAMPLE REPORT — This is an example using a fictional lease."
   - the grade gauge (`C`, `62/100`), a headline sentence, "26 clauses reviewed · 8 issues found" and the severity count line
   - "Checked against Florida's landlord-tenant statutes"
   - five full flag cards, high first
   - the paywall: "Unlock 3 more flags with Pro", an email field ("Where should we send your report?") and "Unlock Full Report — $19.99" (Stripe)
   - three locked LOW flags, each with title and clause quote, the explanation blurred, and "Unlock with Pro"
   - "Florida — Key Tenant Rights (Free)": deposit limit and notice period
5. **Upgrade.** Pay $19.99 once or subscribe; the report is emailed. "Upgrade to Pro any time within 7 days — no need to re-upload." Results are kept for 7 days.
6. **Account** (`account.png`). Email and password sign-in or create an account, described as optional and used to keep report history.

## Things worth copying in Blue Line's own form

- The order on the results page: overall signal first, then counts by severity, then ranked cards.
- Each card answers the same questions in the same order: what it says, why it matters, what to do.
- The free preview shows locked items' **titles and quotes** and hides only the explanations, so the reader can still see that the lease has them.

## Things to avoid, given Blue Line's settled rules

- A grade that means "Safe to sign" (CLAUDE.md, ADR 0004, ADR 0014).
- `MAY NOT BE ENFORCEABLE` badges and statute-based conclusions. These are Layer 2 (ADR 0014).
- The phrase "could put your deposit or rights at risk… Review before signing" is a verdict-shaped headline. Blue Line's summary is neutral and gives no verdict.
