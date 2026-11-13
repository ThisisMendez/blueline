# 30. Sign in to save or draft after a guest reads the report

Status: implemented in 0.2.0, production activation pending

Activation depends on the production signup and sign-in checks in [ticket 37](37-email-confirmation-and-report-return.md).

Approved flow. Let guests upload a lease and read their review, including the score, flags, quotes, and explanations. Prompt for sign-in when they choose **Save this review**, **Create email draft** as a renter, or open a landlord drafting tool to revise lease wording. Keep drafting free for signed-in beta users and leave future pricing open.

Guest reports currently live in tab memory. Verify that a new account and an existing account can return to the same report and resume the chosen action without a second model call. Restore the selected renter issues and require a separate save action before adding the report to the library when sign-in was for drafting. Preserve the report if the visitor cancels or authentication fails. Keep lease text out of browser persistence and URLs. Test account ownership, expiry, and confirmation delivery. Confirm the live email sign-in configuration before enabling the gate. Keep marketing signup separate and opt-in.
