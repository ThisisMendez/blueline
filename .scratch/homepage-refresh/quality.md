# Lane 6: quality checks

The candidate was checked in the isolated `feat/homepage-visual-refresh` worktree. Only `.env.example` was present. The regular build ran with telemetry off and empty model, Supabase, and contact service bindings. Smoke commands used the deterministic offline fixture path.

| Check | Result |
| --- | --- |
| `npm run lint -- --ignore-pattern '.scratch/homepage-refresh/local/**'` | Passed. Excluded the generated baseline work directory only. |
| `npm test` | Passed, 654 tests in 60 files. The existing Vitest warning about a future config loader change did not affect the run. |
| `npm run smoke -- --role=renter` | Passed. Planted risks and the clean case reviewed, with 9 and 0 verified flags respectively and no dropped flags. The packet with missing references stopped as expected. |
| `npm run smoke -- --role=landlord` | Passed. Planted risks and the clean case reviewed, with 9 and 0 verified flags respectively and no dropped flags. The packet with missing references stopped as expected. |
| `NEXT_TELEMETRY_DISABLED=1 npm run build` | Passed. Next compiled, typechecked, and generated all 38 pages. |
| `npm run typecheck` | Passed after the regular production build. |
| `npm run build:fixtures` | Passed. Next built all 38 pages with accounts disabled and deterministic synthetic responses at runtime. |
| `npm run start:fixtures -- --port 34952` | Ready, bound to loopback only. Candidate browser QA uses `http://127.0.0.1:34952/`. |

These checks establish local application behavior. They do not verify hosted authentication, storage, or live model quality.
