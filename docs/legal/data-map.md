# Data map

| Activity | Inputs and results | Where it goes |
| --- | --- | --- |
| Upload and extract | PDF, extracted text, document names and chosen role | PDF parsing is in the browser. The review request carries extracted text and names to Vercel. [PDF parser](../../src/features/packet/extract/pdf.ts) · [Analysis request](../../src/features/analysis/server/route.ts) |
| Analyze | Lease content, selected role, report data, personal red lines if used by the review pipeline | Vercel invokes OpenRouter and its pinned provider. The verified production provider is Fireworks AI. [Model client](../../src/features/analysis/model/openrouter.ts) |
| Guest report | Review input and results in the browser | The app does not add guest reviews to the library. If continuation is configured, the browser may hold encrypted continuation material for return after sign-in. [Browser store](../../src/features/review/session/store.ts) · [Continuation files](../../src/features/review/session/continuation.ts) |
| Library | Review, associated extracted document text, appendix titles, findings, topic coverage, dates and account ID | Supabase Postgres. Row-level policies enforce account ownership; expiry and purge are separate. [Retention migration](../../supabase/migrations/0005_review_retention.sql) |
| Account | First name, account email, ID, password handled by Supabase, verification state, age confirmation and policy confirmation details for new app signups | Supabase Auth. Credentials or codes travel only through the auth flow. Account-email copies may transit a configured email provider. Essential cookies support sign-in, confirmation, and review continuation. [Signup action](../../src/features/auth/actions.ts) |
| Red lines | User-provided text and account ID | Supabase Postgres. [Red lines migration](../../supabase/migrations/0003_personal_red_lines.sql) |
| Contact and beta feedback | Name, reply address, topic and message. Feedback may include usefulness, page and role, and can omit email | Vercel to Formspree to the support mailbox if the verified form is enabled. Direct support mail goes through the configured mail route. [Contact endpoint](../../src/features/site/contact-route.ts) |
| Operations | Technical metadata such as requests, client IP, or email delivery events, depending on the service | Vercel, Supabase and relevant vendors. Lease bodies and authentication secrets do not belong in application logs, tickets or operating records. Check provider-level controls separately. |

Review documents may contain third-party data. The upload notice asks customers to remove sensitive details before submitting. See [Vendor DPAs](vendor-dpas.md) for the AI contract question and [Retention schedule](retention-schedule.md) for lifecycle details.
