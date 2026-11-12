# Blueline Redline

Residential lease review with exact source citations. It reads the lease text only: it does not check terms against local law or judge enforceability (see ADR 0014). The existing Next.js application lives in `src/app/`; feature code lives in `src/features/`.

## Run locally

Use Node 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, fill in the OpenRouter key and model, then run `npm run dev`. Open `http://localhost:3000` or go directly to `/review`.

The app starts without credentials and explains unavailable services. Real analysis requires `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Paid models default to Fireworks. Set `OPENROUTER_PROVIDER` to select another provider. A `:free` model requires an explicit provider and uses zero token and request price caps. Calls still require low reasoning and strict structured JSON, with no provider fallback. An incompatible configuration returns an error.

Anonymous analysis works with or without configured Supabase and is never saved by Blueline. Only the library and personal red lines require an account. Model processing still sends extracted text to the configured external provider; this application makes no claim about that provider's retention policy.

## Test an anonymous deployment on Vercel Hobby

Import this repository into a personal Hobby project with the Next.js preset,
Node.js 24.x and Fluid Compute. Leave the Supabase variables blank to run without
accounts or saved reviews. Set the OpenRouter key as a server-only environment
variable, then set the model and provider for the target deployment. Vercel
assigns a `.vercel.app` address. Open `/review` there and test a selectable-text
PDF from `tests/fixtures/`. The browser extracts the PDF text before submitting
the review; no file storage service is needed.

For a synthetic smoke test, `OPENROUTER_MODEL=liquid/lfm-2.5-2.6b:free` and
`OPENROUTER_PROVIDER=liquid` completed a review from a PDF in Chrome. This model
missed a planted serious term and missed the answer to a question the lease
addresses. Its free endpoint may use prompts and outputs for training.
Use this configuration for synthetic testing. Validate the endpoint's data
policy and model quality before inviting people to submit real leases. The
OpenRouter free quota is shared by every visitor, and a review can use several
model calls. See [the endpoint's policy](https://openrouter.ai/liquid/lfm-2.5-2.6b:free)
and [OpenRouter's free quota](https://openrouter.ai/collections/free-models).

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke
```

Tests and the default smoke run use deterministic responses at the external model boundary. They require no live credentials. The smoke command prints synthetic source sentences and verification counts while exercising the real route, completeness check, schemas and citation pipeline.

`npm run smoke -- --live` uses `.env.local` and sends one synthetic planted-risk fixture to the configured model. It is bounded to seven requests (one is the legal-claim repair, used only when needed), 30 seconds per request and a two-minute start budget. It does not prove independent model quality. See `evals/README.md` for the separate evaluation prerequisites and `BUILD-REPORT.md` for current evidence and limitations.

## Browser checks with synthetic fixtures

Run `npm run build:fixtures`, then `npm run start:fixtures -- --port 3100` and open `http://127.0.0.1:3100/review`. The fixture build replaces generated `.next` output and blanks Supabase configuration at build time and runtime. A build marker prevents starting a previously configured production build in fixture mode. Run the normal `npm run build` again for your normal deployment configuration.

The local server prints a deterministic-mode banner. It substitutes responses only at the OpenRouter HTTP boundary; the Next application, schemas, verification and UI run unchanged. It accepts only the complete synthetic document text in `tests/fixtures/`, including normalized whitespace from the selectable-text PDF. Use `adhesion-lease.txt` for planted flags, `clean-lease.txt` for a clean result and `referencing-lease.txt` for missing documents. Q&A examples are in the corresponding JSON sidecars. Arbitrary or edited documents receive a provider error instead of sample results. Do not paste real leases into this test server.

The default 250 ms delay per model request makes loading states visible; set `BLUELINE_FIXTURE_DELAY_MS` from 0 to 5000 when starting to change it. This harness neither authenticates users nor tests deployed persistence or live-model quality. It is absent from `npm start` and production imports. Do not run builds concurrently.

## Configure persistence

Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for an existing Supabase project. Ordered schema migrations are tracked under `supabase/migrations/`. This build does not create a hosted project or apply remote migrations. SQL and deployed row-level security need separate verification before relying on account persistence.

Email sign-in uses `/auth/confirm`. In Supabase Authentication → URL Configuration, set the Site URL to your app's default origin and allow its callback URL. For a local-only setup, use `http://localhost:3000` as the Site URL and allow `http://localhost:3000/auth/confirm` (an existing `http://localhost:3000/**` entry also covers it).

The default Supabase email template works with the app. Request the link from Blueline's sign-in form and open it in the same browser profile so the callback can exchange the returned PKCE code using the verifier cookie. A custom email template can still send users to `/auth/confirm?token_hash={{ .TokenHash }}&type=email`. To check that sign-in created a session, verify that `/review` shows **Sign out** after following the link, then reload and check again.

Do not commit private lease text, environment files, database dumps or credentials.

### Retention deployment gate

Apply the ordered migrations through `0006_expiry_schedule.sql` to an existing staging project before enabling the library. `0005` makes review creation atomic, derives lifecycle timestamps from the database clock, and limits table access to unexpired owned reviews. Completion retains a review for 30 fixed 24-hour days; each explicit save sets a new 90-day expiry from that save. Browser-supplied timestamps cannot change these dates. The library uses explicit composite-foreign-key hints for its nested queries because multiple relationships exist. See [Supabase joins and nesting](https://supabase.com/docs/guides/database/joins-and-nesting).

At expiry, account access stops. Physical deletion is a separate operation: `0006` schedules `purge_expired_reviews()` every minute, deleting the review and cascading to its extracted text, flags and checklist rows. It requires [Supabase Cron / pg_cron](https://supabase.com/docs/guides/cron/install); migration failure or a failed cleanup job is a deployment blocker, not evidence that expired text was deleted. A normal successful job removes expired rows on the next run. Monitor job failures and delays; do not promise deletion at the exact expiry instant.

The write RPCs use narrowly scoped security-definer functions because direct table writes are revoked. They pin their search path, check the authenticated owner and expose only the required execution grants. The purge RPC is unavailable to anonymous and authenticated clients. Review [Supabase function security guidance](https://supabase.com/docs/guides/database/functions) when deploying or changing grants.

Before relying on persistence, verify with synthetic data in that staging database:

1. Use two authenticated accounts to create/read reviews through the real API. Confirm the nested library query works and account B cannot read or save account A's review, text, flags or checklist. Confirm unauthenticated RPC calls fail.
2. Confirm direct table inserts/updates and caller attempts to alter owner, `created_at`, `saved_at` or `expires_at` are denied. Inspect database-owned dates after creation, a later explicit save and another save: expiry must be completion +30 days or latest save +90 days.
3. Submit a synthetic packet with an invalid child row through `create_review`; confirm the transaction leaves no review or document behind. Adapter mocks cannot establish rollback behavior.
4. With privileged staging-only setup, create consistent synthetic rows whose expiries are just before/after now (the lifecycle check constraint must remain enabled). Verify expired rows are inaccessible through each account query and cannot be revived by `retain_review`.
5. Inspect `cron.job` for active `blueline-purge-expired-reviews`, then `cron.job_run_details` for a successful actual run. After that run, use an administrative query to confirm the expired parent **and** its `review_documents.extracted_text` rows, flags and checklist rows are physically absent. RLS hiding alone does not prove deletion. Keep an unexpired control review and confirm it remains.

The repository's controlled-clock and database-boundary tests verify application behavior only. Migrations, grants, row-level security, actual transaction rollback and scheduled physical deletion require the checks above; they have not been executed by the offline suite.
