# Blueline

A web app for people signing contracts they did not write. Someone uploads a
contract, lease, freelance agreement, or terms of service and gets back: a
plain-English summary; the clauses that could hurt them, ranked by severity,
each showing its exact source sentence; a counter-offer drafted for each flag;
a question box that answers only from the document; an editable list of their
own red lines that drives the analysis; and a saved library of past documents.

## Read these first

- `research/summary.md` holds the user research. Read it before deciding what
  the product should do.
- `PRD.md` will hold the brief once it exists. Read it before building.

## Settled

Decided. Do not reopen.

- Next.js, Supabase for auth and database, deployed on Vercel.
- Model calls go through OpenRouter.
- The uploaded file is parsed in the browser. Only the extracted text is stored.
- Every risk flag cites the exact sentence it came from. A flag whose source
  cannot be shown is a bug.

## Undecided — stop and ask

Do not pick one of these to stay unblocked.

- Which OpenRouter model. Read it from one env var; never hardcode a model id.
- Which formats parse in the browser (paste, PDF, docx). Settles in the PRD.
- Whether a Supabase project exists yet. Do not scaffold a throwaway project
  or mock auth to get past a missing key.

## Scope

Build the capabilities listed at the top and stop there. When something looks
like the obvious next step and is not on that list, ask first.

Payments, billing, OCR for scanned documents, and sharing a document between
users are excluded on purpose. This version exists to prove the analysis can be
trusted, and none of those make it more trustworthy. OCR would actively undermine
it, because a citation is worthless when the text it points at was misread.

## Rules

- Keep credentials in `.env.local`, which is gitignored. Never commit a secret,
  because a key is public the moment it is pushed and has to be rotated.
- Call OpenRouter from a server route so the key never reaches the browser.
- State only what the document says. Where the text does not support a claim,
  the product does not make it.
- Ask before adding a dependency.
- Anything else that needs me and is not in the stop-and-ask list: park it in
  `QUESTIONS.md`, keep building what does not depend on it, and raise the
  parked questions together.

## Agent skills

Issue tracker, triage labels, and domain docs are configured in `docs/agents/`.
