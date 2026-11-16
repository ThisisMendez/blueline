# Rhode Island rental law reference pilot

Draft for owner review. The Resources pilot lists selected sections of Rhode Island's Residential Landlord and Tenant Act. The lease report, drafting tools, and score continue to use the supplied documents. The pilot covers state sources for residential rentals. Local rules may apply.

## Candidate references

| Topic | Official source | Scope and dates checked |
| --- | --- | --- |
| Rental terms and fees | [R.I. Gen. Laws § 34-18-15](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-15.htm) | Addresses rental terms and includes fee and utility disclosures and exceptions. The compiled history dates the 2024 amendments to January 1, 2025. |
| Rent increase notices | [§ 34-18-16.1](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-16.1.htm) | Addresses notice and coverage exceptions. The compiled history dates the 2024 amendments to June 24, 2024. |
| Prohibited provisions | [§ 34-18-17](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-17.htm) | Provisions addressed by the section |
| Security deposits | [§ 34-18-19](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-19.htm) | Addresses deposit amount, deductions, and return. The 2018 amendments took effect upon passage on July 2, 2018. [Chapter 229](https://webserver.rilegislature.gov/PublicLaws/law18/law18229.htm) · [Chapter 260](https://webserver.rilegislature.gov/PublicLaws/law18/law18260.htm) |
| Repairs and maintenance | [§ 34-18-22](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-22.htm) | Addresses landlord maintenance duties and conditions. The compiled history dates the 2021 amendments to January 1, 2022. |
| Access to the home | [§ 34-18-26](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-26.htm) | Entry, notice, and exceptions |
| Ending a periodic tenancy | [§ 34-18-37](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-37.htm) | Periodic tenancy only |

Sections 34-18-7 and 34-18-8 set the chapter's geographic application and exclusions. The public page includes only the seven state topics above. The periodic-tenancy section concerns periodic notice, and the pilot makes no statement about early termination of a fixed-term lease. The 2026 survivor act amended the chapter's definitions and added separate protections effective July 1, 2026. A dated review should consider those changes and other enacted laws before publishing. [State chapter index](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/index.htm) · [Application](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-7.htm) · [Exclusions](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/34-18-8.htm) · [2026 chapter 147](https://webserver.rilegislature.gov/PublicLaws/law26/law26147.htm) · [2026 chapter 148](https://webserver.rilegislature.gov/PublicLaws/law26/law26148.htm)

The pilot excludes § 34-18-20. The enacted 2026 shoreline disclosure amendments in chapters 165 and 166 take effect January 1, 2027. The current-year enacted-law index changes independently of the compiled sections, and both need review. [Official 2026 public-laws index](https://webserver.rilegislature.gov/Lawrevision/plshort/pl2026sub.htm) · [Enacted chapter 165](https://webserver.rilegislature.gov/PublicLaws/law26/law26165.htm) · [Enacted chapter 166](https://webserver.rilegislature.gov/PublicLaws/law26/law26166.htm)

LeaseGuard AI's public material describes state-specific source references alongside findings and a quarterly database update. Its presentation is a comparison point for citation placement. [LeaseGuard methodology](https://leaseguardai.com/how-it-works)

## Source review and expiry

The [source register](rhode-island-sources.json) starts with pending entries. Before publishing, have the designated reviewer compare the compiled sections with enacted changes. Record the reviewer's name in `reviewer`, the date in `reviewedOn`, a deadline no more than 30 days later in `reviewBy`, and the reviewed source fingerprint in `sha256`. Record applicability and effective-date evidence in this document. For an enacted amendment affecting a pilot section or the shared scope that takes effect later, also set `amendmentEffectiveOn` on the affected row. At that date, the link or shared scope is held for review even if the source bytes match. Use UTC calendar dates in the register and add the current year's public-law index when the calendar year changes.

Run `npm run legal:check-ri` before release and review the weekly GitHub Actions result. A source change, redirect, timeout, missing baseline, or expired review fails the check. The workflow opens or updates a repository issue. Review the section text and effective dates before replacing a fingerprint. A formatting change still needs a record of what was reviewed. Retain the prior review in Git history.

The Resources link and direct route both require `RHODE_ISLAND_RESOURCES_ENABLED=true`. Set it only after the source review and release checks pass, then redeploy so the Resources link includes the new setting. When enabled, each page request compares the state pages to their recorded fingerprints without serving cached results. A section check that fails hides that section. A failed check of the chapter index, application, exclusions, or current-year enacted-law index hides the whole list. A temporary network failure can recover when a later check matches the still-current baseline. To suspend an entry pending review, clear its review fields and deploy the updated register. The page uses existing hosting and the weekly check uses the existing GitHub workflow.

## Change log

- November 13, 2026. Established the draft scope and review process. Initial fingerprints and publication approval are pending.
- November 15, 2026. Checked the seven source titles against the General Assembly pages, confirmed relevant amendment dates, excluded § 34-18-20, and implemented the Resources route and source checks. The register awaits reviewed fingerprints and the production gate awaits release verification.
