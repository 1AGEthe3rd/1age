# 1AGE — consolidated release checkpoint 030

## Outcome

One source branch consolidates the retained ecosystem builds through 023, the 027 Search improvement, reconstructed 024–026 packaging behavior, a new World chunked-preview adapter, public domain/registrar audit and a branch-only release helper. Existing repositories, deployments, source trees and geographic databases remain separate. No production domains, hosting, charges or main branches changed.

- Build 028: restore documented packaging/review protections and consolidate Search.
- Build 029: prepare Cloudflare configurations and World engine chunk streaming outside the original export.
- Build 030: verify domain status, reconcile handoffs and package main/Space source for GitHub review.

## Handoff status and remaining work

| Area | Implemented and tested | Still needed |
| --- | --- | --- |
| Search | 324-record source index, categories/relevance, source-linked 3D relationships, accessible paging/filtering, 40 quality queries and 12 ecosystem scenarios | Larger curated/automated coverage, production review, device WebGL validation |
| Homepage/menu/ticker | Retained responsive/orbit/search/whole-row menu and ticker source fixes; regression suites pass | Physical Chuwi/NanoTE/iPhone and browser-history review |
| Cloudflare | Complete-export validator, 12 standalone static preview configs, World chunked-engine artifact and streaming handler tests | Account access, Wrangler compilation/upload, hosted browser/input tests; historical 522 root cause remains unconfirmed |
| Checkout/Cash/Plus | Tested mock order/signature/idempotency/refund/ledger/account/entitlement foundation; optional $1/month Plus presentation | Production identity, approved payment-provider account, secure deployed storage/services, provider webhooks and business policies; no live sales |
| Page/shared identity | Private-by-default local-test profiles, narrow single-use authorization handoff, independent 3D Page entry | Production auth/OIDC integration, secure cross-domain callbacks, avatar/presence/friends/messaging |
| Exchange | Independent 3D entry and read-only injected-wallet adapter fixtures | Real-wallet/device checks, verified balances, approved payments/swap/bank integrations; none live |
| Games | 3D network-universe entry, 3 checked seed game records, guest discovery | Wider authorized multichain index, real game integrations, optional Page presence; no promised rewards |
| Store/Blog | Independent 3D experiences, structured demonstration content and reusable exports | Provider-specific preview tests and separate Blog repository/project; no invented merchandise |
| Space | Dedicated 3D property viewer/API/indexing source retained; 6,011,627 canonical footprints, 53,500 address rows, 408 curated locations verified locally; 66 regression tests pass | Hosted data/API plan, further lawful imports, actual units/listings/claims, authorized models/interiors; no verified vacancy claims |
| World | Original export and engine preserved; byte-identical chunk reconstruction verified | Real Cloudflare preview and touch/control/hologram browser testing; no replacement of newer export from older Godot source |
| Design/Quest/App/Shop | Preserved tools and generic 3D entrance source | Dedicated application capabilities; Quest gameplay remains deferred |
| Domains | 14 registration/DNS/HTTPS audits, secondary resolver checks, exact issue matrix | Authenticated zone inventory and specific approval before changes; ten existing GitHub Pages targets should stay in place |

## Verified tests

- Main Python suites: 36 tests passed before adding the 3 branch-publishing tests, which also passed.
- Checkout/account/identity: 38 tests passed.
- Dedicated Space: 66 tests passed against fixtures/local API tests; its source is clean and unchanged.
- JavaScript: 19 suites passed (Search, homepage/input, orbit paging/fallback, World streaming and commerce interfaces).
- Independent packages: 12 local HTTP asset deliveries and final hashes pass as part of the Python suite.
- Review packaging: nine entrypoints, 528 checked references, no missing or forbidden files in the local review artifact.
- Real World engine: all 39,514,754 bytes reassembled with the exact source hash. Original export validates; the raw file exceeds both Cloudflare Pages and Workers Static Assets per-file limit.

These checks do not establish production auth/payments, hosted service health or real-device 3D rendering. The local Chromium launcher is unavailable; the optional browser smoke test remains unrun. Wrangler has not been installed or executed against a Cloudflare account.

## GitHub publication boundary

Remote `1AGEthe3rd/1age/main` was verified at `da557410c5e70fbc0e266358081faab11233ead7`. A safe attempt to create `release/ecosystem-review-030` was rejected with HTTP 403, `Resource not accessible by integration`. The terminal has no GitHub credentials; a dry-run push also failed authentication. No remote review branch was created, and no main branch was pushed.

The release kit contains full source bundles for 1age and the retained dedicated Space branch, plus static review artifacts and a checksum-verified helper. The helper has been tested with real Git against disposable local bare repositories. It creates new isolated clones, verifies every file and release head, checks that current main is an ancestor, and optionally pushes only `review/*` branches without force. It never merges, deploys, changes DNS or modifies existing development folders. The test confirms both remote main branches stay unchanged.

In the kit, run `python3 prepare-release-review.py --kit .` to prepare isolated review trees. Add `--push-review` only when the GitHub account on that computer has the necessary repository access. The output provides compare links; merging is a separate production decision. Do not run older main-publication scripts for this checkpoint.

## Safe stopping point and next sequence

1. Restore write-capable GitHub access and push/review the two pinned source branches. Keep main and current sites untouched until release review.
2. Compile and test the separate World preview through the authenticated Cloudflare account; verify streaming WASM, isolation headers, rendering and touch input. No new paid resource is assumed.
3. Review existing GitHub Pages application roots using the 3D exports. Do not replace the dedicated Space platform with its generic main-repository entrance.
4. Resolve Exchange/Quest delegation or DNSSEC failures with authenticated records; plan Cash and Blog mappings only after their preview targets work. Preserve email/verification records and existing nameservers until a specific approved change.
5. Establish production Page identity and storage before deploying Cash/Plus account services. Complete provider onboarding/security/business review before real subscriptions or credit sales.
6. Continue Search coverage, independent app functionality and licensed property expansion in subsequent builds. The complete master handoffs remain partially implemented; generic shells and mocks are not finished services.
