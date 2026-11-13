# Signup confirmation email

The signup screen accepts a one-time email code. It also supports the original confirmation link. Production Supabase currently uses the built-in sender, which limits delivery to project team members and locks template editing. A custom SMTP sender is needed to use the new template for public signup. [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)

After deploying the verification screens, confirm the production Site URL and enable the authorized sender. Update only **Confirm sign up** under Supabase **Authentication → Emails → Templates**. Save a copy of the previous template for rollback.

Subject

```text
Confirm your Blueline email
```

Body

```html
<h2>Confirm your Blueline email</h2>
<p>Paste this one-time code into the signup screen:</p>
<p><strong>{{ .Token }}</strong></p>
<p>You can also <a href="{{ .SiteURL }}/verify-email#token_hash={{ .TokenHash }}">open the confirmation page</a> and choose Verify email.</p>
<p>If you have a review open, keep that tab open. Return to it after you sign in and choose Continue after sign-in.</p>
<p>If you didn’t create an account, you can ignore this email.</p>
```

Use two fresh test signups to check the code and the link separately. Verify delivery to an inbox outside the Supabase project team. From the original review tab, choose the draft or save action, confirm in the signup tab, and return to continue. Confirm exact selections, no second analysis, and explicit saving. Check password sign-in, resend, and reset before activating guest drafting or saving. Keep verification codes and sender credentials out of logs and commits.
