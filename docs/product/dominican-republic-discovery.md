# Dominican Republic expansion discovery

Reviewed November 18, 2026. Discovery only. A Dominican Republic launch or live upload pilot still needs a separate decision. This work stays within the current plans and uses public sources and synthetic documents.

## Future release target: v0.6.0 (tentative)

Run discovery alongside the Rhode Island pilot; v0.5.0 stays focused on making that pilot reliable. Use the discovery results for a v0.6.0 go/no-go decision on a small, invitation-only Dominican pilot. Keep v0.6.0 uncommitted until the requirements below are met and the owner approves launch. If a gate remains open, defer the launch rather than taking live uploads. No new plan or spend is authorized.

## Why explore it

The Dominican National Statistics Office found that 42.47% of households rented in its 2024 survey. There is a large rental population. Discovery should establish whether people reviewing a lease before signing want document explanations, have suitable files, and can use the report to prepare better questions. [ONE, ENHOGAR 2024, graph 6](https://www.one.gob.do/media/r4tpwmxo/bolet%C3%ADn-demogr%C3%A1fico-y-social-no-13-familia-y-hogares.pdf)

A private Dominican pilot would reuse Blueline's document review and exact quote checks. A second market also means maintaining Spanish copy and support, a new set of official sources, and a new test set. Keep the Rhode Island pilot first. Use discovery to decide whether there is enough demand and a workable path to justify that ongoing work.

## What the official sources show

- **Rental law.** Law 85-25, published in Gaceta Oficial 11211 on August 15, 2025, replaced the earlier deposit laws and the rent control decree. It governs residential, commercial, and nonprofit rentals nationwide, with exclusions including rural estates, boarding and lodging, and tourist or recreational rentals of up to 90 days. It contains transitional provisions and refers to the Civil Code and Code of Civil Procedure for matters it leaves open. Long-term residential leases are a practical first scope. Verify amendments, implementing rules, contract dates, and applicable exceptions before publishing references. [Official text, arts. 1–2 and 51–58](https://www.consultoria.gov.do/Consulta/Home/FileManagement?documentId=3403704&managementType=1)
- **Personal information.** The Superintendency of Banks lists Law 172-13 as in force. Article 80 addresses transfers outside the country. A March 2026 Senate agenda lists a proposal to amend the law. Enactment of that proposal was unverified at this review. Local review should confirm current law and the basis for sending lease data abroad, including personal details about other signers, guarantors, or occupants. [Law status](https://www.sb.gob.do/regulacion/leyes/ley-no-172-13-proteccion-de-los-datos/) · [Official text, art. 80](https://egehid.gob.do/descarga/490/leyes/25388/ley-172-13-proteccion-integral-de-los-datos-personales.pdf) · [Senate agenda, initiative 01294-2026-PLO-SE](https://www.senadord.gob.do/Descargas/1379/orden-del-dia/55456/agenda-ordinaria-00105-plo-24-03-2026-se)
- **Operating the service.** Dominican consumer law covers Spanish wording, clear terms, express acceptance, and registration for covered standard contracts. Pro Consumidor's registration service addresses local and international providers. Dominican counsel should confirm what applies to a U.S.-operated free beta, including business registration, notices, and whether personalized flags or proposed wording raise issues around the practice of law. [Consumer law, arts. 81–83](https://www.proconsumidor.gob.do/files/Ley_General_de_Proteccin_de_los_Derechos_del_Consumidor_o_Usuario_No__358-05.pdf) · [Pro Consumidor registration procedure](https://proconsumidor.gob.do/contratos-de-adhesion/) · [Dominican bar law, arts. 9–10](https://dgii.gov.do/legislacion/leyesTributarias/Documents/Otras%20Leyes%20de%20Inter%C3%A9s/3-19.pdf)

## Discovery milestones

1. Define the group to test with. Start with people preparing to sign a long-term residential lease. Find out what they want to understand before signing, which file and language formats they actually receive, and how they look for help today.
2. Outline a Dominican Spanish review and resources experience. Use public sources and synthetic files to test local vocabulary, dates, pesos and U.S. dollars, guarantors, and attachment names. Preserve each source quote verbatim in its original language. Note whether scans are common enough to justify separate work on text recognition. [Citation design](../adr/0001-every-flag-cites-its-source.md)
3. Map the data path and current plan limits. Blueline reads files in the browser and sends extracted text for analysis. Check where that text, saved reviews, logs, support messages, and backups go, how long they stay there, and how each can be removed. Bring the map and unresolved provider terms to a local review. [Vendor register](../legal/vendor-dpas.md) · [Service providers](../legal/subprocessors.md)

## Before accepting a real Dominican lease

- Validate demand and the proposed audience. Make the introductory scope clear in Spanish and select jurisdiction by where the property is located.
- Resolve local legal and data handling questions. Publish reviewed Spanish terms, privacy and upload notices, and a working support and deletion process. Check the vendor settings against the disclosures with synthetic data.
- Use a separate set of Dominican lease examples with independent human labels. Check missing attachments, serious misses, false flags, and exact citations before a limited release. [Independent evaluation plan](../../evals/holdout/README.md)
- If publishing general references, assign an owner, review dates, and a process to hide changed or expired sources pending review. Keep those references separate from the document-based report and score. [Rhode Island reference design](../adr/0017-link-to-reviewed-rhode-island-sources.md) · [Report scope](../adr/0014-layer-1-reads-the-lease-not-the-law.md)

Bring the results back for a decision on a limited pilot. If local review or the data path requires a paid service, record that cost and leave the pilot pending.
