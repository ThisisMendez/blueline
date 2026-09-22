# Implementation fixtures

These agreements, people, organizations, addresses and lease terms were invented for application tests. They contain no supplied customer documents or real personal information. The `.json` sidecars record author-selected expectations, not independent human adjudications.

- `adhesion-lease.txt` plants deposit, early-exit, dispute and other consequential terms, with high and medium severity expectations.
- `clean-lease.txt` has no planted risks and omits repairs and dispute routes from the coverage checklist.
- `referencing-lease.txt` needs both `fee-schedule.txt` and `pet-addendum.txt`; submitting the lease alone exercises incomplete-agreement blocking.
- `adhesion-lease.pdf` carries selectable text. `textless-lease.pdf` exercises rejection. `npm run fixtures:pdf` regenerates those synthetic PDFs.

`npm test -- tests/fixtures/fixtures.test.ts` checks sidecar source sentences against their corresponding text. The deterministic model client in `tests/support/fixture-model-client.ts` substitutes only the external model response; application parsing, validation, citation verification and rendering remain real.

Do not use these fixtures as held-out model-quality evidence or tune model prompts against their expected outputs. Independent evaluation has its own intake and scoring workflow under `evals/`.
