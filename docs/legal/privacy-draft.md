# Privacy Policy (draft)

Draft dated 2026-11-13. Not in effect. The page at the matching route renders only on preview and development builds (`src/features/site/legal-gate.ts`) and returns 404 on production. The page text comes from `src/features/site/legal-content.ts`; keep this file and that one in sync.

## Owner/counsel must verify

- [ ] Confirm Blueline Redline's legal entity name, address, and the governing law and venue.
- [ ] Write the disclaimer and limitation-of-liability text (placeholder in the page).
- [ ] Choose a public support address and set `SUPPORT_EMAIL` in `src/features/site/contact-config.ts`; then replace the "still setting up" contact lines.
- [ ] Confirm the minimum age for users.
- [ ] Confirm the model provider OpenRouter routes to in production (`OPENROUTER_PROVIDER`, Fireworks by default) and read OpenRouter's and that provider's data retention and training terms. The request does not currently set a data-collection or zero-retention flag.
- [ ] Confirm what Vercel and Supabase log (request logs, IP addresses, auth events) and for how long; the draft does not cover logs.
- [ ] Confirm no analytics, advertising, or tracking scripts are added; the draft says only that we don't sell data.
- [ ] Confirm that pg_cron cleanup (migration 0006) is applied in production, since the draft says expired reviews are deleted every minute.
- [ ] Decide how deletion requests are handled until there is an in-app delete for reviews and accounts, and who handles them.
- [ ] Write the state privacy rights section (CCPA/CPRA and others), and say where data is stored (Supabase and Vercel regions).
- [ ] Confirm whether Supabase auth emails (sign-in links, password reset) go through Supabase's mailer or a custom SMTP provider, and name it if needed.

---

## What we collect

The text of your lease and any documents you add, the titles they carry, the side you chose, and the review we produce. We never receive the PDF file itself.

If you create an account: your email address, the display name you give us, and your password, which our sign-in provider stores in hashed form. If you sign in with Google, we receive your name and email address from Google.

If you are signed in: the personal red lines you write (up to 20).

We use cookies to keep you signed in.

## How a review is processed

Your browser reads the text out of each PDF. The file stays on your device.

The text and your chosen side go to our server, which sends them to an AI model through OpenRouter. OpenRouter passes the request to a single model provider that we choose in our settings, and that provider processes the text to write the review.

If you are not signed in, we don't save the text or the review in our database.

## How long we keep it

If you are signed in, each completed review is kept in your library for 30 days. If you save it, we keep it for 90 days from that save. The library shows each review's expiry date.

When a review expires you can no longer open it, and a scheduled cleanup that runs every minute deletes the stored text and results.

Your red lines stay until you change them or your account is deleted.

## Deleting your data

There is no button yet to delete a single review or your whole account. Until there is, ask us through the contact page and we will delete it.

## Who else handles your data

Supabase stores accounts and saved reviews. Vercel hosts the site. OpenRouter and the model provider it routes to process the text of each review. Each one handles data under its own terms.

We don't sell your data.

## Your rights

[Counsel to draft: rights under state privacy laws, age limits, and where data is stored.]

## Changes and contact

If we change this policy, we will update this page and the date at the top. To reach us, use the contact page. We are still setting up a public contact address.
