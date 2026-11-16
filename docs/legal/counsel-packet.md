# Future counsel review

Blueline Lease is a free beta operated by Alexis Mendez, an individual in Rhode Island. These materials are self-drafted and have not been reviewed by a lawyer. Provide this packet and the linked source material to a lawyer when the operator retains one.

## Materials to review

- Current and permanent versions of the public [Terms and Privacy text](../../src/features/site/legal-content.ts), [signup and guest disclosure](../../src/features/auth/components/SignInForm.tsx), and [review intake](../../src/app/(app)/review/page.tsx).
- The [data map](data-map.md), [vendor evidence list](vendor-dpas.md), [retention schedule](retention-schedule.md), [privacy request procedure](privacy-deletion-procedure.md), [incident response procedure](incident-response.md), and [legal changelog](CHANGELOG.md).
- Synthetic screenshots of renter and landlord intake, review, any source citations, drafting, and the consent checkbox. Include approved private vendor contracts and configuration evidence separately.

## Questions to resolve

1. Which restrictions on unauthorized practice apply to individualized AI flags and editable language, in Rhode Island and elsewhere? Review the scope and presentation of landlord and renter guidance, especially any future law pilot. [Rhode Island unauthorized practice statutes](https://webserver.rilegislature.gov/Statutes/TITLE11/11-27/INDEX.htm) · [Rhode Island Residential Landlord and Tenant Act](https://webserver.rilegislature.gov/Statutes/TITLE34/34-18/INDEX.htm)
2. Are the beta warranties, limits, indemnity, governing law, court venue, and consumer rights language appropriate? Verify operator identity and whether any other contact information is required.
3. What Rhode Island and other privacy rules apply to website operations and handling documents with third-party information? Review controller identification, minors, sensitive-data minimization, vendor terms, regions, retention, deletion, requests and breach procedures. [Rhode Island privacy act](https://webserver.rilegislature.gov/Statutes/TITLE6/6-48.1/INDEX.htm) · [Rhode Island breach statute](https://webserver.rilegislature.gov/Statutes/TITLE11/11-49.3/11-49.3-4.htm)
4. Is the guest notice adequate? Is the signup record sufficient, and when do existing users need a renewed agreement? The current app stores new signup agreement details in Supabase user metadata; users can edit this kind of metadata through Supabase, so it is not an immutable audit record. A database-level Auth Hook or server-owned log would be a separate project.
5. What should change if the app expands provider use, adds legal coverage or introduces payments? Review the evidence of actual data flows before approving any privacy or law-coverage claims.

Track decisions, review dates, affected versions and next steps in the private compliance log.
