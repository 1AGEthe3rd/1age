# Build 001 — first implementation checkpoint

Date: November 21, 2026 (founder timezone).

## Protected state

Main source refreshed from GitHub at da55741. Isolated worktree `search-build-001`, branch `feature/search-ecosystem-001`. Existing commerce-dev, Space, Store, Plus and homepage worktrees left unchanged. Main and production configuration not modified. Prior release backups remain on GitHub. This checkpoint is not the completed master handoff.

## Search implementation

Reused MiniSearch, sharding, deterministic generators, update scripts and current search page. Added six source-reviewed records (community, Discord, Reddit, X destination, video, funding); enhanced the existing developer record instead of creating a duplicate. Catalog: 308 to 314 records. Publisher-referenced relationships have evidence URLs and are distinct from identity verification. X is listed by Solana but its destination fetch was denied; that limit is recorded. No private messages or social account contents were ingested.

Added category selection, supplemental destination links, related resources and broad-ecosystem result diversification, preserving exact-name priority, typo matching and existing search modes. No homepage scene or brand changes. People category currently has no person records. Search submission/correction workflow and 3D entity viewer remain pending.

Tests: 40/40 prior relevance cases; nine new query scenarios (counts/types/timing in ecosystem-search.json); sharded/full-index equivalence; category isolation; inferred relationships excluded. 16 Python index/update tests, 14 checkout tests, checkout reload tests, device-layout and homepage restoration tests passed. New manual browser QA blocked: the cloud browser cannot reach executor localhost:4175 (connection refused); no mobile/hardware performance claim. Engine timings exclude browser fetch/render/network.

## Cloudflare

No Cloudflare connector was exposed by tool discovery. Dashboard navigation reached an unauthenticated sign-in screen; account projects, private logs and DNS remain uninspected. No preview deployed. Existing public World repository metadata confirms GitHub Pages enabled. Local export: real GDPC PCK 13,272,952 bytes and WASM 39,514,754 bytes. PCK is not a Git LFS pointer. Cloudflare Pages official limit is 25 MiB per file: this WASM cannot be directly uploaded unchanged. It is an established packaging blocker, not a verified explanation of the historical 522. Workers limits, remote artifact parity and deployment logs still require investigation. Existing GitHub Pages remains untouched. No nameservers or DNS records modified. Do not infer hosting success from source pushes.

Docs: https://developers.cloudflare.com/pages/platform/limits/

## Checkout and Cash

Preserved services/checkout/core.py and server.py, mock provider, SQLite orders/events/ledger/membership/fulfillment tables and browser recovery. Existing tests pass; no approved real provider integration or merchant access established. Internal debit logic uses BEGIN IMMEDIATE, sufficient balance checks and duplicate-key checks. The mock account identifier is not production authentication. Authenticated Cash UI, production identity, receipts/history authorization, reconciliations and provider-specific subscriptions/refunds remain pending. No real charges, real entitlements or Cash sale enabled. Do not remove accurate test labels before real activation is verified.

## Plus, Store, Blog and World

Existing standalone Store/Plus packages and main Blog/shared 3D viewer retained, not replaced. New Plus monogram/plus scene, combined Blog concepts and World touch/menu/hologram updates not yet implemented. Latest founder rule is Store and Blog only in universal destination menu; existing homepage includes additional legacy controls requiring careful reconciliation, not blind deletion. World scenes and movement untouched. Independent Blog hosting not confirmed. No new domains activated.

## Space

Read-only inventory in space-preservation-audit.json: 40 properties, 45 sources, one demonstration VirtualSpace, no populated Building/Unit/OwnerClaim/PhysicalListing collections. Geographic coverage is address metadata, not a complete geographic database. Coordinates absent. No schema migration or data edits; published repository retains recovery history. No interiors, vacancies or ownership invented. Separate HQ city work remains independent.

## Deployment matrix

| Component | Status in this checkpoint |
|---|---|
| Search changes | In development; engine tests pass; browser verification pending |
| 1age.com production | Prior source publication confirmed; live rendering not verified this checkpoint |
| World Cloudflare | Blocked on account authentication; no verified preview |
| Checkout | Local mock implemented/tested; production provider integration not started |
| Cash | Demo ledger retained; authenticated application not started |
| Store / Plus | Existing prototypes retained; live deployment not reverified |
| Blog | Existing main-repository prototype retained; independent domain pending |
| Space | Source main 171d427 refreshed; existing prototype/data retained; live deployment not reverified |
| Page / Exchange / Games / Quest / Design | Not audited or changed in this checkpoint |

## Next dependency order

1. Browser-accessible preview: verify search submission, category changes, links and homepage regression on portrait/landscape/desktop before any publication.
2. Add verified public person records, submission/correction intake and richer relationship coverage; extend tests.
3. Authenticate Cloudflare in Work browser; inspect project logs and remote export, then prepare reversible oversized-asset solution and preview. Production changes need founder approval.
4. Extend existing checkout with real identity boundaries and authenticated Cash account ledger/history; provider sandbox integration after secure merchant setup.
5. Implement approved 3D entity viewer and Plus, then Store/Blog/World interactions, preserving scenes and data.

No new paid infrastructure introduced. Static search has no paid API dependency; hosting, traffic and payment costs are not yet measured.


## Search Build 002 — 3D result expansion

Implemented reusable lazy-loaded Three.js entity explorer with a symbolic central hologram, up to 16 deduplicated public destination spheres, source-backed related entities, raycast tap selection, horizontal drag, keyboard turning, rotate/zoom/reset buttons, destination/evidence links and native modal focus handling. Initial result cards remain readable and gain subtle reduced-motion-aware depth. 3D loads only after explicit activation; expanded relationships load the current mode's complete catalog so narrow queries retain connections. WebGL/module failure retains usable destination buttons. Rendering is on demand with a capped pixel ratio and GPU cleanup on close. No external entity logos, identities or 3D applications were fabricated.

Browser QA now uses supported `sites-preview` relay rather than the earlier standalone localhost server. Observed: Search starts closed; typing Solana does not display results; submit returns 96 results; central Solana scene renders with eight destination nodes; Discord button selects its destination and relationship source; rotate/zoom/close work; Communities category yields four results; reopening works. Destination data tests cover unsafe URLs, unverified relationship exclusion, deduplication, scene limit and empty records. Prior 40 relevance cases, sharded routing tests and restoration checks still pass. Physical mobile touch, portrait/landscape and low-power hardware verification remain pending. No claim of production readiness or live publication.

Founder verification in the preview browser:
1. Close the entity viewer; choose All categories.
2. Search Solana, Phantom, Solana discord, Star Atlas, Solana grant, 1AGE Space, phantm and a nonsense word.
3. Open Explore connections in 3D on Solana. Turn and zoom; select Discord and check the destination/source links. Escape or Close must return to results.
4. Check Communities and Opportunities filters; People may be empty because verified person data is not yet indexed.
5. Return home. Confirm search is closed and the globe/dial behavior matches the approved design.
6. On an actual touchscreen preview, repeat in portrait and landscape; confirm vertical page scrolling, horizontal orbit dragging and readable controls. Do not use live 1age.com to verify unpublished changes.

GitHub push remains blocked by missing executor Git authentication. All changes remain on the isolated development branch until a reviewable release is explicitly published.
