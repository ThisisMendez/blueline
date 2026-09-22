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

## Configure persistence

Provide `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for an existing Supabase project. Ordered schema migrations are tracked under `supabase/migrations/`. This build does not create a hosted project or apply remote migrations. SQL and deployed row-level security need separate verification before relying on account persistence.

Email sign-in uses `/auth/confirm`. Configure the Supabase site URL and redirect allowlist for your deployment, and use a token-hash email template pointing at `/auth/confirm?token_hash={{ .TokenHash }}&type=email`. Do not commit private lease text, environment files, database dumps or credentials.
