# REA findings and technical evidence

## How REA was located and run

- **This Claude Code session:** REA isn't registered as an MCP server. It doesn't appear in the project `.mcp.json` or in `~/.claude.json`, and no REA tools were exposed.
- **Cursor:** `~/.cursor/mcp.json` doesn't exist. The Cursor project for the REA lab (`~/.cursor/projects/Users-mendez-Desktop-dev-reverse-engineering-lab/mcps/`) lists only `cursor-ide-browser` and `plugin-vercel-vercel`, so REA wasn't connected as an MCP server in Cursor either.
- **Earlier use:** `~/Desktop/dev/byeos-research/01-ENVIRONMENT-SETUP.md` (20 October 2026) records REA running as a **Codex** MCP server from the local checkout. `~/.codex/config.toml` no longer has an `mcp_servers.rea` entry.
- **What worked, with nothing installed or reconfigured:** the existing local checkout at `~/Desktop/dev/reverse engineering lab` (`rea-agents` 6.7.0, commit `3fca2e0ca6e54ba700c286d9a85a9600dee6a19d`), run as a CLI under Node 24.21.0:

  ```bash
  cd "~/Desktop/dev/reverse engineering lab"
  node scripts/rea.mjs capture-browser-scenario <scenario.json> --format json
  ```

  Each scenario launched a headless Chromium 157.0.8103.51 from `/Applications/Google Chrome.app`, using a temporary profile that REA owns. REA closed the browser after every run (`browser.cleanup = terminated-owned-process`).
- **Optional reconnection:** to get the MCP tools back in Codex, Cursor or Claude Code, REA's own skill says to run `npx -y rea-agents@6.7.0 setup --client <codex|cursor|claude_code> --dry-run --json` first and review the plan before applying it. That wasn't run, because you hadn't approved any configuration changes.

## Scenario shape

Each page used the same bounded scenario (inputs are in `evidence/scenarios/`): open the URL, wait 3 seconds (8 seconds for the sample report), then capture the accessibility tree, a screenshot and the final URL, plus `network` and `console` events. The viewport was 1440 × 2400 (6000 for the sample report, 1400 for account). Request bodies, response bodies and header values were **not** captured, which is REA's default.

## Evidence index

| Capture | Path | Evidence ID | Completeness |
|---|---|---|---|
| home | `/` | `ev_277ebf0e4711d2bda6318ca58ac7f6ed2d5b5cb2320c28bb2629860a56bfe5a4` | complete |
| features | `/features` | `ev_fbb0a066186ac890c8a7339d568e43e2ff8773c609944d0b9c7cc733d67caa5a` | complete |
| how-it-works | `/how-it-works` | `ev_210ddf74ce0a0b46a7fc467da4b2faf3dae694df7a6b0e467cd3e4a42abbf277` | complete |
| pricing | `/pricing` | `ev_ec5b50ea3d6cfa79cd9b9cb3cb79ff81add7ec0ee4b0983d6927f6ae62387428` | complete |
| analyze | `/analyze` | `ev_9ad8f9fe262f283015522ddf6cf5907c57bf29e66c285a164fd0ef6fcd1b01a2` | incomplete¹ |
| sample-report | `/analyze?demo=true` | `ev_3b28f771831952b8e22aff6a3d96acfa8d3868b8c7fee7d065dd2f2b417fa9f4` | complete |
| account | `/account` | `ev_56b540cf9f33e063b2348b37278854867c005d45dfab2c4257c6f99893ccb3aa` | complete |
| trust | `/trust` | `ev_63672af24503a78d8ea734ad9f1fb59eb6d2b3ae0447a8a3037ec8578d5b92eb` | complete |
| about | `/about` | `ev_3ab69936d3da1c40c6d1a5eb83514493e45c3315e538b9f2833a4be3910db16c` | complete |
| privacy | `/privacy` | `ev_c60b3217ceac6d88ad343914339273185d28ec8ec4dda19dc98560dfa8c1e9e6` | complete |
| terms | `/terms` | `ev_9f4cfa0612e22fc32ceaf7b2a7b3e12b04bfe4ca329764df265f98dffc46046b` | complete |
| contact | `/contact` | `ev_778776b2af94ae91c0d75fe1a38e24b8c56ce5aa254f22d1d755956651666558` | incomplete¹ |
| blog | `/blog` | `ev_389a1d667f7624a04e2de8776205dab42c6b1949f735b0a230af177b17abb685` | complete |
| tenant-rights-florida | `/tenant-rights/florida` | `ev_d97b6ca116f9b1e49f616a8bb87cd935bc4afbc284a34efe25bcf6078741bb54` | complete |
| blog-best-apps | `/blog/best-lease-review-apps` | `ev_e7d5d3df26deceea9b559d546ce603fa42eec7f9d8ddad21d43384db37a42607` | complete |
| blog-trust | `/blog/leaseguard-ai-trust` | `ev_894cd78594086376cfce9d8dda08a43b5a799fadd4f87bc44b959e0ff01e845a` | complete |
| blog-why-trusted | `/blog/why-leaseguard-ai-is-trusted-by-renters` | `ev_ed6beadf0f422755c8c9c1a14b8481b93d193ae74a5d30adc65cfb50f7642fce` | complete |

¹ For `analyze` and `contact`, REA recorded "Some network requests had not completed when capture ended". Both pages load Cloudflare Turnstile (`challenges.cloudflare.com`), which keeps a request open. The page content was still captured in full.

## Technical observations (rendered output only)

- **Third-party origins on every page:** Google Tag Manager and Analytics, Google Ads/DoubleClick, Reddit pixel (`redditstatic.com`, `alb.reddit.com`), and Google Fonts. `/analyze` and `/contact` also load Cloudflare Turnstile. (Comparison: Blue Line uses no analytics, per ADR 0014.)
- **Framework:** robots.txt disallows `/_next/`, which points to Next.js. This is an inference from the path, not something verified.
- **Sample report rendering:** the locked flags' explanations are blurred on screen. We didn't check whether the text is still in the DOM (see the README's Boundaries).
- **What LeaseGuard says about itself, not verified:** the trust page lists "AI Model: GPT-4o (OpenAI)". Lease documents are "processed in memory and discarded", while results, including clause snippets, are kept 7 days. Payments run through Stripe.

## What REA did not establish

- The analyzer's real output on any lease, the speed of the response, the PDF and email outputs, comparison, the dashboard, sharing, and Deposit Shield.
- The Health Score formula, the clause-splitting method, the statute data or the prompts. These are server-side, and the terms put them off limits.
