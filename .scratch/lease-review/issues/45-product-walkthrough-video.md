# 45. Publish the finished product walkthrough

Status: resolved

## Requested behavior

The owner authorized adding the existing finished Product & Approach video to the customer-facing site and deploying directly to production on November 20, 2026. Skip staging for this release. Retain the protected PR and required Quality checks; do not create or change unrelated infrastructure.

- Use the actual finished 90-second overview, poster and verified English captions from `videos/blueline-demo/overview/out/` in the owner's primary checkout.
- Place a compact, responsive preview after the process explanation and before secondary detail in existing walkthrough locations. Preserve primary analysis actions, navigation and renter/landlord selection.
- Provide accessible native playback controls, no autoplay, deferred video downloading, a poster and captions.
- Keep the product's current legal limits and identify the recorded fictional sample.
- Run lint, route types, typecheck, tests, production build and both offline role smokes. Check desktop/mobile playback and the public media URL.
- Review the production diff, merge through the existing PR flow, then verify the production page, media and playback before marking the release complete.

## Implementation

The homepage How It Works section and `/how-it-works` share a small native video component. The MP4, JPEG poster and WebVTT are copied byte for byte to `public/media/`; the MP4 SHA-256 is `d72a3638f5c62f8ea08db36df9b740f095e0d43f7c91b3ec1b797f82f6195e59`.

The Vercel deployment exception applies only to `feat/product-walkthrough`, suppressing its automatic Preview deployment. The merged `main` commit still deploys to the existing Production project. No account, model, schema, provider, domain or infrastructure settings change.

## Verification

Local lint, route type generation, typecheck, all 671 tests, the production build and both deterministic role smokes pass. Chrome checks at 1440px and 390px confirm both existing pages load, the MP4 is not requested before playback, native controls play and seek the 90-second 1080p file, 23 caption cues load, neither layout overflows, and renter/landlord selection still works. No analysis was submitted.

The [release record](../../../docs/handoff/v0.4.6-release.md) describes the integration and local evidence. The published GitHub release records the reviewed commit, required CI and verified production result; implementation alone does not establish deployment.
