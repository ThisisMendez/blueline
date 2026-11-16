# Blueline Lease account email

The signup screen accepts a one-time code and supports a confirmation link. The built-in Supabase sender limits delivery to project team members. Use verified custom SMTP for public signup. [Supabase SMTP setup](https://supabase.com/docs/guides/auth/auth-smtp)

In Supabase, open **Authentication → Emails → Templates**. Before editing, save the previous subject and body privately so they can be restored. Set the confirmed production Site URL and narrow callback allowlist. Disable email click tracking so the provider does not rewrite authentication links. [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates)

| Supabase template | Subject | Body |
| --- | --- | --- |
| Confirm sign up | Confirm your Blueline Lease email | [Confirm signup HTML](../../supabase/templates/confirm-signup.html) |
| Magic link | Sign in to Blueline Lease | [Sign-in link HTML](../../supabase/templates/magic-link.html) |
| Reset password | Reset your Blueline Lease password | [Password reset HTML](../../supabase/templates/reset-password.html) |
| Change email address | Confirm your Blueline Lease email change | [Email change HTML](../../supabase/templates/change-email-address.html) |

Keep Secure Email Change on. Supabase can send a confirmation to both the current and new address and require both to approve. Confirm behavior before enabling an email-change control in the app. [Supabase email-change settings](https://supabase.com/docs/reference/javascript/auth-updateuser)

Use two fresh synthetic accounts with authorized, accessible inboxes outside the Supabase project team. Confirm one by code and one by link. In a guest review, start a draft or save action, keep the review tab open, confirm the account, and return to that tab. Check that the app preserves the role and selected findings, avoids a second analysis, and saves only when requested. Test resend, password sign-in, an existing-account sign-in link, and password reset. New accounts must create a password and agree to both policies on the signup screen first.

Keep verification codes, links, and sender credentials out of logs and Git. If verification fails, keep the previous email configuration available for rollback and keep guest continuation features gated until they pass.
