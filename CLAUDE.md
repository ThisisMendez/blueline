# Blueline

## Read these first

- `PRD.md` holds the first-version brief.
- `.scratch/lease-review/spec.md` holds the implementation spec; tickets are tracked in `.scratch/lease-review/issues/`.
- `BRAND.md` holds the product name, palette, and voice.
- `CONTEXT.md` holds the domain vocabulary. Use its terms, not the ones it lists to avoid.
- `research/summary.md` holds the user research behind these decisions.

## Settled

Decided. Do not reopen.

- Next.js, Supabase for auth and Postgres, deployed on Vercel. Model calls go through OpenRouter, from a server route so the key never reaches the browser.
- The uploaded file is parsed in the browser. Only the extracted text is stored, never the original file.
- Every risk flag cites the exact sentence, verified verbatim against the extracted text. A flag whose source can't be shown is a bug.
- State only what the document says. No safe-to-sign or legal-validity claims.
- The OpenRouter model is `z-ai/glm-5.3-flash`, read from `OPENROUTER_MODEL`. Never hardcode a model id even though this one is chosen.

## Undecided — stop and ask

Do not pick one of these to stay unblocked.

- Whether a Supabase project exists yet. Do not scaffold a throwaway project or mock auth to get past a missing key.

## Scope

Build only what PRD.md, the spec, and the tracked tickets call for. Something that looks like the obvious next step but isn't ticketed: ask first. Expansion beyond lease signers needs independent evidence, not a feature that feels useful (ADR 0012).

## Rules

- Keep credentials in `.env.local`, which is gitignored. Never commit a secret.
- Ask before adding a dependency.
- All copy a user reads in this product — landing page, labels, errors, empty states — runs through the humanizer skill before commit. Copy that reads like a model wrote it is a defect.
- When grilling me, put every question as options to pick from, not free text.
- Anything else that needs me and isn't in the stop-and-ask list: park it in `QUESTIONS.md`, keep building what doesn't depend on it, raise the parked questions together.

## Agent skills

Issue tracker, triage labels, and domain docs are configured in `docs/agents/`.

## Repository layout

- `src/app/` owns routes, layouts, and route-level styling.
- Route groups organize marketing, authentication, and product surfaces without changing their URLs.
- `src/features/<feature>/` owns feature-specific UI, state, schemas, server logic, and tests.
- Create `src/shared/` only when code is genuinely used by multiple features.
- Root directories are reserved for configuration, durable product context, research, tracked plans, migrations, tests, and agent tooling.
- Do not create a new top-level source directory or a second application root without recording the architectural reason.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
