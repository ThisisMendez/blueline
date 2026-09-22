# Blueline Redline

Residential lease review with exact source citations. The existing Next.js application lives in `src/app/`; feature code lives in `src/features/`.

## Run locally

Use Node 24 and npm. Run `npm ci`, copy `.env.example` to `.env.local`, fill in the OpenRouter key and model, then run `npm run dev`. Open `http://localhost:3000` or go directly to `/review`.

The app starts without credentials and explains unavailable services. Real analysis requires `OPENROUTER_API_KEY` and `OPENROUTER_MODEL`. Calls require the Fireworks provider, low reasoning and structured JSON, with no provider fallback. An incompatible configuration returns an error.

Anonymous analysis works with or without configured Supabase and is never saved by Blueline. Only the library and personal red lines require an account. Model processing still sends extracted text to the configured external provider; this application makes no claim about that provider's retention policy.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run smoke
```

Tests and the default smoke run use deterministic responses at the external model boundary. They require no live credentials. The smoke command prints synthetic source sentences and verification counts while exercising the real route, completeness check, schemas and citation pipeline.

`npm run smoke -- --live` uses `.env.local` and sends one synthetic planted-risk fixture to the configured model. It is bounded to six requests, 30 seconds per request and a two-minute start budget. It does not prove independent model quality. See `evals/README.md` for the separate evaluation prerequisites and `BUILD-REPORT.md` for current evidence and limitations.

## Browser checks with synthetic fixtures

Run `npm run build:fixtures`, then `npm run start:fixtures -- --port 3100` and open `http://127.0.0.1:3100/review`. The fixture build replaces generated `.next` output and blanks Supabase configuration at build time and runtime. A build marker prevents starting a previously configured production build in fixture mode. Run the normal `npm run build` again for your normal deployment configuration.

The local server prints a deterministic-mode banner. It substitutes responses only at the OpenRouter HTTP boundary; the Next application, schemas, verification and UI run unchanged. It accepts only the complete synthetic document text in `tests/fixtures/`, including normalized whitespace from the selectable-text PDF. Use `adhesion-lease.txt` for planted flags, `clean-lease.txt` for a clean result and `referencing-lease.txt` for missing documents. Q&A examples are in the corresponding JSON sidecars. Arbitrary or edited documents receive a provider error instead of sample results. Do not paste real leases into this test server.

The default 250 ms delay per model request makes loading states visible; set `BLUELINE_FIXTURE_DELAY_MS` from 0 to 5000 when starting to change it. This harness neither authenticates users nor tests deployed persistence or live-model quality. It is absent from `npm start` and production imports. Do not run builds concurrently.

## Configure persistence

Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for an existing Supabase project. Ordered schema migrations are tracked under `supabase/migrations/`. This build does not create a hosted project or apply remote migrations. SQL and deployed row-level security need separate verification before relying on account persistence.

Email sign-in uses `/auth/confirm`. Configure the Supabase site URL and redirect allowlist for your deployment, and use a token-hash email template pointing at `/auth/confirm?token_hash={{ .TokenHash }}&type=email`. Do not commit private lease text, environment files, database dumps or credentials.
