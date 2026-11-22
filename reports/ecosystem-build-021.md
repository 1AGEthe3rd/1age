# Ecosystem Build 021 — Independent holographic Games entrance

November 22, 2026. Branch feature/games-holographic-entry-021, based on Page Build 020. Not deployed.

## Implemented

Added experiences/games with a black/green 3D ecosystem scene, selectable spherical ecosystem nodes, a holographic-style discovery panel, explicit-submit title/description search, network filtering, safe external game links and accessible non-3D controls. The existing official logo and Store/Blog-only logo menu are reused. Public exploration requires no login. Independent Games static packaging is enabled; existing apps/games local gameplay is preserved with a link to the new entrance.

The scene derives its groups from actual catalog records. A separately evidenced network annotation places Star Atlas under Solana. Skyweaver and Upland are left in Unclassified; the existing Upland network label was not assumed to prove a blockchain association. Unclassified is a coverage group, not an invented chain. No rewards, current playability or availability are verified. Each game opens its own independent website; no game was copied, embedded or represented as an integrated first-party 3D destination.

Three source-checked external game records are reused from the shared Search index. This is seed coverage, not comprehensive global/P2E indexing. scripts/build-games-catalog.py regenerates this derived catalog without editing scene code, and --check rejects stale output. New network assignments require an explicit evidence record. Search and data-only operations remain independent from rendering; the scene renders at most 12 ecosystem groups while the accessible controls expose all indexed groups.

## Source check

Star Atlas official documentation was opened: https://build.staratlas.com/introduction/what-is-star-atlas. It supports the Solana association; no economic promises from that page are reproduced.

Upland's existing source was opened: https://guides.upland.me/getting-started/basics. Network classification remains unknown.

A Skyweaver support page was found but fetching it timed out, so this build does not assign its current network from old snippets or third-party claims. Existing website/source-check dates remain visible and are not converted into a claim of current service availability.

## Controls and performance

On-demand rendering, bounded geometry, capped pixel ratio, resize/revisit handling, mouse/touch rotation, tap-versus-drag distinction, multi-touch cancellation, keyboard rotation and manual rotate buttons are implemented. Context loss and initial WebGL failure retain the accessible game list. Initial rendering does not require automated continuous motion. Game descriptions are inserted as text; unsafe destination URLs and duplicate IDs are excluded by the model.

## Verification

- Node catalog/model checks pass for three source-backed records, checked/unknown network grouping, search, safe URLs and deduplication.
- Deterministic catalog --check passes.
- Independent package link validation passes, including Games and Page.
- Existing Page control and 3D destination-model checks pass; JS syntax and diff checks pass.
- Browser rendering, raycast/touch interaction and mobile layout were not visually verified. These remain implementation needing visual QA, not approved production visuals.

## Local and independent entry

Serve the source as static content and open /experiences/games/. The account/payment backend is unnecessary for this seed discovery experience. Use scripts/build-commerce-apps.py --out /new/empty/output to prepare a standalone games package with index/assets and its intended CNAME. The CNAME is not evidence of domain ownership, working DNS or deployment.

No Page token transport, friend-presence layer, multiplayer server, wallet connection, P2E reward verification or game purchase system is implemented here. Exchange and Games remain separate from Page/Space/World. The previous private review Site is unchanged and does not include this build yet. No production DNS or live payment changes were made.

Next: visual review, expand permitted game sources and network evidence, then integrate reviewed Page identity/presence without making discovery depend on sign-in.
