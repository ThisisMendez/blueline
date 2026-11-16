# Retention schedule

| Record | Schedule | Check |
| --- | --- | --- |
| Guest review | In the current tab. Optional guest return authorization expires after two hours. | Verify review is absent in the library until explicitly saved and that an expired return is rejected. Tab memory may remain while the tab is open. |
| Saved library review | Expires 30 days from initial save or 90 days from the current extension. | Verify the expired row becomes inaccessible immediately under library access rules and the scheduled purge deletes the primary and related rows. [Expiry](../../supabase/migrations/0005_review_retention.sql) · [Schedule](../../supabase/migrations/0006_expiry_schedule.sql) |
| Supabase account and agreement details | Until account deletion, subject to separate backup and permitted retention considerations. | Verify the identity before applying a request. Account-linked reviews and red lines cascade, which should be confirmed after deletion. |
| Personal red lines | Until edited, removed or account deletion. | Check account-specific rows and cascading deletion. |
| Pending signup email cookie | Up to 24 hours. | Verify it is cleared after successful code verification. |
| Contact and support messages | Keep only as needed to respond and follow up, subject to a justified retention exception. | Formspree Free shows only 30 days. It does not delete older submissions automatically. Verify deletion of each applicable vendor and mailbox copy. Review current support inventory monthly. [Formspree limits](https://help.formspree.io/articles/account-management/account-limits) |
| Provider logs, transactional mail and backups | Provider and account specific. | Check the project configuration and applicable vendor terms before promising a deadline. Resend publishes separate email retention by plan. [Resend retention](https://resend.com/security/gdpr) · [Supabase residency and backups](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) |
| Privacy and incident records | Keep minimal restricted evidence required to handle requests or legal obligations. | Ask counsel to confirm how long to keep incident and request evidence. |

The November 15, 2026 production check showed an active `blueline-purge-expired-reviews` schedule and a recent successful run. Verify end-to-end deletion periodically with a synthetic, operator-owned account and review. Test deletion separately in primary storage and document any vendor or backup exceptions.
