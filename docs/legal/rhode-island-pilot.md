# Rhode Island rental law reference pilot

Draft for owner review. This pilot provides links to official sources for Rhode Island residential rentals. The lease report reads the supplied documents, and the pilot has no connection to its score or suggested wording.

## Candidate references

| Topic | Official source | Scope to review |
| --- | --- | --- |
| Rental terms and fee disclosures | [R.I. Gen. Laws § 34-18-15](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-15.htm) | Residential rental agreement terms and the section's exceptions |
| Rent increase notices | [§ 34-18-16.1](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-16.1.htm) | Notice requirements, including distinctions within the section |
| Prohibited provisions | [§ 34-18-17](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-17.htm) | Provisions addressed by the section |
| Security deposits | [§ 34-18-19](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-19.htm) | Deposit amount, permitted deductions, and return |
| Repairs and maintenance | [§ 34-18-22](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-22.htm) | Duties and the section's conditions |
| Access to the home | [§ 34-18-26](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-26.htm) | Entry, notice, and exceptions |
| Ending a periodic tenancy | [§ 34-18-37](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-37.htm) | Periodic tenancy only |

Confirm the chapter's scope and exclusions before assigning applicability. For a Providence topic, verify the ordinance through the city code and City Clerk records, and label it as Providence. [State chapter index](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/index.htm) · [Providence codes](https://www.providenceri.gov/inspection/codes-ordinances/) · [City Clerk](https://council.providenceri.gov/city-clerk/)

Check enacted public laws as well as the compiled sections. For example, enacted 2026 P.L. ch. 165 adds language to § 34-18-20 that was absent from the compiled page reviewed on November 13, 2026. Confirm the act's effective date and any companion amendments before using either text. [Official 2026 public-laws index](https://webserver.rilegislature.gov/Lawrevision/plshort/pl2026sub.htm) · [Enacted chapter 165](https://webserver.rilegislature.gov/PublicLaws/law26/law26165.htm) · [Compiled § 34-18-20](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-20.htm)

LeaseGuard AI's public material describes state-specific source references alongside findings and a quarterly database update. Its presentation is a comparison point for citation placement. [LeaseGuard methodology](https://leaseguardai.com/how-it-works)

## Source review and expiry

The [source register](rhode-island-sources.json) starts with pending entries. Before publishing, assign a reviewer, compare the compiled sections with enacted changes, and record applicability, any verified relevant effective date, a review date, a deadline 30 days later, and the fetched source fingerprint. Add the current year's public-law index at the start of each legislative year.

Run `npm run legal:check-ri` before release and review the weekly GitHub Actions result. A source change, redirect, timeout, missing baseline, or expired review fails the check. The workflow opens or updates a repository issue. Review the material section text and effective dates before replacing a fingerprint. A formatting-only change still needs a record of what was reviewed. Retain the prior review in Git history.

Before any public pilot, implement hiding for entries with a failed or expired check and verify that behavior. The current pilot lives in the repository. The check reports changes for review and leaves the register untouched.

## Change log

- November 13, 2026. Established the draft scope and review process. Initial fingerprints and publication approval are pending.
