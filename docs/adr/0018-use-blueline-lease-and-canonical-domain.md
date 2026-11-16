# 0018. Use Blueline Lease and a single public domain

Use Blueline Lease as the public product name and `bluelinelease.com` as the primary address. Change the brand in the app and its metadata together. Use the existing Git repository, database, and environment variable names. Earlier ADRs record what the project called itself at the time.

Move the public address with permanent 301 redirects in the app once production is serving valid HTTPS on both custom domains. The redirect starts when Production sets `NEXT_PUBLIC_SITE_URL` to the apex. Before then, metadata and navigation still work on the existing Vercel address. A permanent redirect keeps old public links useful and gives search engines a single address to list.

The 301 applies to page GET and HEAD requests on the original public Vercel host and `www.bluelinelease.com`. It carries the path and query to the apex. API requests, auth callbacks, and form submissions stay on their original host. Browser sessions are host-specific, so users may need to sign in again after the move. See the [production domain steps](../version-control.md#production-domain).
