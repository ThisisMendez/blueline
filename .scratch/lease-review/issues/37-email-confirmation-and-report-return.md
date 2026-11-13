# 37. Fix signup email and preserve the guest report

Status: app implemented for 0.3.0, live delivery pending custom SMTP

Ask for first name, email, and password on account creation. Supabase creates the account ID. Keep existing account names, ownership, and login methods compatible. Confirm new accounts by email.

Reproduce the reported broken link with a controlled test inbox. Inspect the delivered link shape, production Site URL and allowed redirects, current signup email template, delivery settings, and callback result without logging a live token. Possible causes include wrong destination, expired or consumed token, missing PKCE verifier, and email-link rewriting. Treat these as hypotheses until verified.

Use an emailed one-time code as the primary signup confirmation method. After signup, show a **Verification code** field and a **Verify email** button on the signup screen. Support copying and pasting the full code, including leading zeroes, and mobile one-time-code autofill. Submit it to the app for server-side verification with Supabase using the signup email and code. Bind verification to the email from signup and use Supabase's expiry and rate limits. Show a clear error and a resend option for invalid or expired codes.

Include a confirmation link as a fallback. Have it open an app page with an explicit confirmation action so opening or previewing the page alone leaves the code usable. Use the existing callback behavior for earlier emails and other sign-in methods. Keep credentials out of logs. Install the updated signup email template after the matching verification screens are deployed. Preserve the original report tab. After verification in the same browser, let visitors return to it and choose **Continue after sign-in** with the selected issues and action intact. Where confirmation opens in a separate browser, guide the visitor to sign in in the original browser. See [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates) and [signup code verification](https://supabase.com/docs/reference/javascript/auth-verifyotp).

Exercise the live email, pasted code, fallback link, link preview, same-browser return, invalid and expired codes, replay, resend, and existing login. Verify public signup with an inbox outside the Supabase project team if the current sender supports it. Preserve password reset and magic-link behavior. Enable the guest draft and save gate from [ticket 30](30-save-after-guest-review.md) after real production confirmation and report continuation work within the $0 budget.
