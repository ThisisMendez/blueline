# Service providers

Status as of the v0.4.0 release review. Technical setup and policy text do not establish contractual coverage.

| Provider | Purpose and typical data | Status and source |
| --- | --- | --- |
| Vercel | Hosting, request handling, application functions and operational metadata | Active. Confirm production Function Regions with deployment evidence; edge serving and provider logs can have different locations. [Function region docs](https://vercel.com/docs/functions/configuring-functions/region) |
| Supabase | Auth, primary database, review copies, account settings and essential session state | Active. Production project's primary region is US East (Northern Virginia, `us-east-1`). Backups, support, and vendor systems have separate handling. [Supabase residency](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) |
| OpenRouter | AI gateway, with lease text, prompts and results | Active. Verify organization logging settings and actual model routing alongside any future privacy or retention claim. [Privacy Policy](https://openrouter.ai/privacy) |
| Fireworks AI, via OpenRouter | Model inference over the review payload | Active on the verified production route. Fireworks publishes data-handling details; confirm how they apply to this customer route before making commitments. [Fireworks Privacy Notice](https://fireworks.ai/privacy-policy) |
| Formspree | Contact and feedback submitted through the web form | Prior configuration, with the new production form off until its approved destination has passed synthetic delivery. [Formspree security](https://formspree.io/security/) · [Formspree account limits](https://help.formspree.io/articles/account-management/account-limits) |
| Google | Mailbox service for support copies | Scope is email. Google sign-in is disabled and is a separate future integration. [Google Privacy Policy](https://policies.google.com/privacy) |
| Cloudflare | Domain services, and if enabled, routing inbound mail to the verified mailbox | Confirm live mail routing and its scope before treating it as active. [Email Routing](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/) |
| Resend | Transactional signup, sign-in and recovery emails if enabled | Confirm domain and production delivery before treating it as active. [Resend GDPR and retention](https://resend.com/security/gdpr) |

When enabling or changing a provider, record the policy version, services, region, information categories, logging and retention, private route owner, DPA evidence, notice decision, and rollback.
