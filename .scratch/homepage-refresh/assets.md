# Homepage artwork

The four candidate WebPs and their PNG masters were recovered from the interrupted image-generation pass. The approved flattened reference is [the homepage mockup](../../docs/design/approved-homepage-mockup.png). Its composition and character supplied the direction for the new art. The new mascot cutouts use the project's current document motif on both accessories. The generated residential exteriors are illustrative and contain no visible addresses or people. Those photos did not require sourcing an outside stock image.

| WebP in `public/images/homepage/` | Runtime size | Bytes | PNG master dimensions | Visual review |
| --- | ---: | ---: | ---: | --- |
| `spotter-hero.webp` | 920 × 841 | 99,556 | 1312 × 1199 | Navy cap and bandana, fictional lease sheet with blue and red highlights. Transparent background. |
| `renter-apartments.webp` | 1088 × 419 | 81,526 | 2020 × 778 | Wide modern multifamily exterior, with architecture and sky visible to the right. |
| `landlord-house.webp` | 1088 × 419 | 75,514 | 2021 × 778 | Wide porch-lit detached home, with prominent windows and entry to the right. |
| `spotter-peek.webp` | 420 × 589 | 37,624 | 1266 × 1243 | A matching smiling face, navy cap and bandana, and one paw positioned at the left edge. Transparent background. |

The masters are in `../homepage-art-masters/`, beside the worktree and outside the runtime bundle. Sharp verified each runtime file's dimensions and that both mascot WebPs contain fully transparent pixels. The peek exceeds the working 352 px source-width estimate by 68 px and stays below the 50 KiB budget. Retain the recovered export for the responsive image optimizer. All four source files together are 294,220 bytes. Responsive transfer sizes require the browser measurement.

The run handoff identifies this work as generated art. The PNG masters and the matching runtime files are available. The image-generation requests, receipts, and per-asset usage clearance are absent from the recovered evidence. Final approval of the actual composed preview is pending.
