# Blueline Redline

Production: https://blueline-khaki-eta.vercel.app

A contract review app for residential leases, built for renters first and supporting landlords. Choose your side, and the review highlights clauses that could harm it, each with its exact source citation. The selected role belongs to that review. V1 reads the lease text only (see ADR 0014). The Next.js application lives in `src/app/`; feature code lives in `src/features/`.

See [Version control and releases](docs/version-control.md) for the version number, production history, and release workflow.

## Run locally

Use Node 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, fill in the OpenRouter key and model, then run `npm run dev`. Open `http://localhost:3000` or go directly to `/review`.

The app starts without credentials and explains unavailable services. Real analysis requires `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Paid models default to Fireworks. Set `OPENROUTER_PROVIDER` to select another provider. A `:free` model requires an explicit provider and uses zero token and request price caps. Calls still require low reasoning and strict structured JSON, with no provider fallback. An incompatible configuration returns an error.

Guests can analyze a lease and read the report without an account. Guest reviews stay in the original tab unless the user chooses to save after signing in. Model processing sends extracted text to the configured external provider.

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

## Production settings

Production needs these four settings. Each is set on Vercel (production environment) and in `.env.local` for local work. Values are never committed.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL`

`OPENROUTER_PROVIDER` is optional here. The production model id doesn't end in `:free`, so calls go to Fireworks by default.

- `REVIEW_CONTINUATION_SECRET` enables sign-in to draft or save a guest report. Generate a random secret of at least 32 bytes and keep it on the server. Verify public signup and sign-in before enabling it. Keep the guest report tab open during sign-in. The report can be resumed for two hours in the original browser. Rotating the secret expires existing continuations.
- `FORMSPREE_FORM_ID` enables Contact and beta feedback. Verify a test message reaches the approved inbox with the fixed subject and expected Reply-To before setting the production value. See [contact setup](research/contact-delivery-options.md).
- See [signup email setup](docs/handoff/signup-confirmation.md) for the code-based confirmation template, prerequisites, and live checks.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke
```

Tests and the default smoke run use deterministic responses at the external model boundary. They require no live credentials. The smoke command prints synthetic source sentences and verification counts while exercising the real route, completeness check, schemas and citation pipeline.

`npm run smoke -- --live --role=renter` and `npm run smoke -- --live --role=landlord` each use `.env.local` to send one synthetic planted-risk fixture to the configured model. The script caps regular model calls at seven per run, with 30 seconds per request. See `evals/README.md` for independent evaluation and `BUILD-REPORT.md` for earlier evidence and limitations.

## Browser checks with synthetic fixtures

Run `npm run build:fixtures`, then `npm run start:fixtures -- --port 3100` and open `http://127.0.0.1:3100/review`. The fixture build replaces generated `.next` output and blanks Supabase configuration at build time and runtime. A build marker prevents starting a previously configured production build in fixture mode. Run the normal `npm run build` again for your normal deployment configuration.

The local server prints a deterministic-mode banner. It substitutes responses only at the OpenRouter HTTP boundary; the Next application, schemas, verification and UI run unchanged. It accepts only the complete synthetic document text in `tests/fixtures/`, including normalized whitespace from the selectable-text PDF. Use `adhesion-lease.txt` for planted flags, `clean-lease.txt` for a clean result and `referencing-lease.txt` for missing documents. Q&A examples are in the corresponding JSON sidecars. Arbitrary or edited documents receive a provider error instead of sample results. Do not paste real leases into this test server.

The default 250 ms delay per model request makes loading states visible; set `BLUELINE_FIXTURE_DELAY_MS` from 0 to 5000 when starting to change it. This harness neither authenticates users nor tests deployed persistence or live-model quality. It is absent from `npm start` and production imports. Do not run builds concurrently.

## Configure persistence

Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for an existing Supabase project. Ordered schema migrations are tracked under `supabase/migrations/`. This build does not create a hosted project or apply remote migrations. SQL and deployed row-level security need separate verification before relying on account persistence.

### Configure account sign-in

Use the `redline` Supabase project for staging. Set `NEXT_PUBLIC_SITE_URL` to the test app's origin and set a unique server-only `AUTH_RECOVERY_COOKIE_SECRET` with `openssl rand -hex 32`. Configure the app origin and the `/auth/confirm` and `/auth/callback` redirect paths in staging's Supabase Auth URL Configuration. Include any required query-string matches for the allowlist, and keep preview rules limited to the staging host.

- Keep **Confirm email** enabled. Email/password users verify their address once when they sign up. Later sign-ins use their password. Existing email-link users can keep using **Sign in with an email link**. When password recovery is configured, they can choose **Forgot password?** to set a password on their existing account. Open standard PKCE email links in the same browser profile where they were requested. Public confirmation and recovery email require a [custom SMTP sender](https://supabase.com/docs/guides/auth/auth-smtp). Use a free sender within its quotas and a domain you control.
- For Google, configure a web OAuth client in Google Cloud with the staging Supabase provider's exact `/auth/v1/callback` URL, then enter the client ID and secret in Supabase Auth → Sign In / Providers → Google. Use the basic identity scopes in the [Supabase setup guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-google). The app's OAuth callback is `/auth/callback`. The Google secret belongs in Supabase's provider settings.
- Test email confirmation, subsequent password sign-in without a new email, recovery, and Google sign-in using test accounts. Reload `/account`, reopen a saved renter and landlord review, and confirm a second account cannot open them. Test that an existing confirmed account using Google with the same verified address retains its UID and library.

Do not commit private lease text, environment files, database dumps or credentials.

### Retention deployment gate

Apply the ordered migrations through `0007_review_roles.sql` to an existing staging project before enabling the library. `0007` stores the selected role and additional finding locations in the existing atomic write. `0005` derives lifecycle timestamps from the database clock and limits table access to unexpired owned reviews. Completion retains a review for 30 fixed 24-hour days. Each explicit save sets a new 90-day expiry from that save. The library uses explicit composite-foreign-key hints for its nested queries because multiple relationships exist. See [Supabase joins and nesting](https://supabase.com/docs/guides/database/joins-and-nesting).

At expiry, account access stops. Physical deletion is a separate operation: `0006` schedules `purge_expired_reviews()` every minute, deleting the review and cascading to its extracted text, flags and checklist rows. It requires [Supabase Cron / pg_cron](https://supabase.com/docs/guides/cron/install); migration failure or a failed cleanup job is a deployment blocker, not evidence that expired text was deleted. A normal successful job removes expired rows on the next run. Monitor job failures and delays; do not promise deletion at the exact expiry instant.

The write RPCs use narrowly scoped security-definer functions because direct table writes are revoked. They pin their search path, check the authenticated owner and expose only the required execution grants. The purge RPC is unavailable to anonymous and authenticated clients. Review [Supabase function security guidance](https://supabase.com/docs/guides/database/functions) when deploying or changing grants.

Before relying on persistence, verify with synthetic data in that staging database:

1. Use two authenticated accounts to create/read reviews through the real API. Confirm the nested library query works and account B cannot read or save account A's review, text, flags or checklist. Confirm unauthenticated RPC calls fail.
2. Confirm direct table inserts/updates and caller attempts to alter owner, `created_at`, `saved_at` or `expires_at` are denied. Inspect database-owned dates after creation, a later explicit save and another save: expiry must be completion +30 days or latest save +90 days.
3. Submit a synthetic packet with an invalid child row through `create_review`; confirm the transaction leaves no review or document behind. Adapter mocks cannot establish rollback behavior.
4. With privileged staging-only setup, create consistent synthetic rows whose expiries are just before/after now (the lifecycle check constraint must remain enabled). Verify expired rows are inaccessible through each account query and cannot be revived by `retain_review`.
5. Inspect `cron.job` for active `blueline-purge-expired-reviews`, then `cron.job_run_details` for a successful actual run. After that run, use an administrative query to confirm the expired parent **and** its `review_documents.extracted_text` rows, flags and checklist rows are physically absent. RLS hiding alone does not prove deletion. Keep an unexpired control review and confirm it remains.

The repository's controlled-clock and database-boundary tests verify application behavior only. Migrations, grants, row-level security, actual transaction rollback and scheduled physical deletion require the checks above; they have not been executed by the offline suite.
