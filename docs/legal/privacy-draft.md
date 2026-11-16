# Privacy Policy (draft)

Draft dated 2026-11-13. Not in effect. The page at the matching route renders only on preview and development builds (`src/features/site/legal-gate.ts`) and returns 404 on production. The page text comes from `src/features/site/legal-content.ts`; keep this file and that one in sync.

## Owner/counsel must verify

- [ ] Identify the operator or entity responsible for personal data and confirm the public support address on a domain it controls.
- [x] The owner chose 18 as the minimum age for the beta.
- [x] The production contact and beta feedback forms were tested through Formspree to the support inbox.
- [x] OpenRouter activity filtered to the production site showed GLM 5.3 Flash through Fireworks on November 13, 2026.
- [ ] Confirm data retention and logging for the deployed provider and workspace. The request does not set a data-collection or zero-retention flag. [OpenRouter retention controls](https://openrouter.ai/docs/guides/features/zdr) · [Fireworks privacy policy](https://fireworks.ai/privacy-policy)
- [ ] Confirm what Vercel and Supabase log (request logs, IP addresses, auth events) and for how long; the draft does not cover logs.
- [x] No analytics, advertising, or tracking integration was found in the app. On November 15, Vercel Web Analytics was off and Speed Insights showed no installation data.
- [x] On November 15, 2026, the production Supabase Cron dashboard showed the review purge job active every minute and its latest run succeeded.
- [ ] Verify physical deletion of an expired synthetic review and its children in hosted Supabase before publishing a deletion guarantee or exact purge interval.
- [x] The owner chose manual deletion requests through Contact, with acknowledgment within five business days and completion within 30 days for verified requests.
- [ ] Test the deletion procedure, including account-email verification, what is deleted in each service, and escalation for vendor copies. See [deletion procedure](privacy-deletion-procedure.md).
- [ ] Confirm which state privacy rules apply and finish the rights section. Supabase shows `us-east-1` for the production database. Confirm Vercel and the other providers' data locations before making any broader claim.
- [ ] Confirm whether Supabase auth emails (sign-in links, password reset) go through Supabase's mailer or a custom SMTP provider, and name it if needed.

---

## What we collect

The text of your lease and any documents you add, the titles they carry, the side you chose, and the review we produce. We never receive the PDF file itself.

If you create an account, we collect your email address and the name you enter. The signup form asks for your first name. Supabase handles your password and confirmation email. If Google sign-in is available and you use it, we receive your name and email address from Google.

If you are signed in: the personal red lines you write (up to 20).

We use cookies to keep you signed in. While you confirm your email address, a cookie holds that address for up to 24 hours. Where you can sign in and return to a guest report, a separate cookie links the report to your browser for up to two hours.

If you send a contact message, we receive your name, reply email, topic, and message. Feedback can include your comment, whether the report was useful, the page you came from, and whether you reviewed as a renter or landlord. Email is optional for feedback.

## How a review is processed

Your browser reads the text out of each PDF. The file stays on your device.

The text and your chosen side go to our server, which sends them to an AI model through OpenRouter. OpenRouter passes the request to a single model provider that we choose in our settings, and that provider processes the text to write the review.

Guest reviews stay in the open browser tab. Where guest saving is available, the app keeps an encrypted copy in that tab so you can sign in and return to the report. The option to return expires after two hours. The app adds the guest review to your library when you choose to save it.

## How long we keep it

A review stored in your library expires 30 days after completion. If you extend a review, it expires 90 days after your most recent extension. The library shows the expiry date for each review.

When a review expires, you can no longer open it. A scheduled cleanup deletes the text and results we stored for that review.

Your red lines stay until you change them or your account is deleted.

## Deleting your data

To ask us to delete a review or your account, use the contact form and enter the email address on your account. We’ll check that you control that address before acting. Expect an acknowledgment within five business days. We’ll complete verified requests within 30 days of receiving them or explain any exception that applies.

## Who else handles your data

Supabase stores accounts and saved reviews. Vercel hosts the site. OpenRouter and the model provider it routes to process the text of each review. Formspree receives contact and feedback submissions and sends a copy to our support inbox.

We don't sell your data.

## Your rights

[Counsel to draft: rights under state privacy laws, age limits, and where data is stored.]

## Changes and contact

If we change this policy, we will update this page and the date at the top. Use the contact form for privacy questions or requests.
