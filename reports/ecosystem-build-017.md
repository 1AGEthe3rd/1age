# Ecosystem Build 017 — Project resource discovery

November 22, 2026. Branch feature/search-project-resources-017, based on Plus Build 016. Development only; no publication or DNS change.

## Actual change

Returned to the all-handoff primary product priority, 1AGE Search. The index grows from 318 to 324 records with three documentation destinations (Jupiter, Helius, Phantom), Jupiter developer Discord and social destinations, and Phantom support information. Each resource has a stable ID, category, source-check evidence/date and a checked resource_for relationship to its parent. Parent project records now include the documentation links; Jupiter also includes its publisher-listed Discord link. Existing non-null links and all prior records are preserved.

The query planner maps docs to documentation. This fixes a concrete zero-result query rather than adding invented descriptions or unrelated keyword results. Category filters still operate on actual resource types. Checked relationships feed the existing related-resource and orbital 3D interfaces; no independent external 3D destination is implied. 1AGE's immediate Solana-first focus and extensible multichain architecture are unchanged.

## Evidence checked

- Jupiter support page https://developers.jup.ag/support links Discord https://discord.gg/jup and developer X account https://x.com/jupdevrel. The X destination returned access denied, so only the publisher linkage is checked, not account content or current social activity.
- Helius documentation https://www.helius.dev/docs was opened and checked.
- Phantom developer documentation https://docs.phantom.com/ was opened and checked.
- Phantom support https://help.phantom.com/articles/6953810233619 was opened and checked.

Descriptions are short original factual summaries. No private content, social posts, user identities or restricted listing data were ingested. Source checking is not verification of ownership, safety, wallet permissions or investment merit. No community invite was joined.

## Verification

All 40 existing search-quality cases pass. Six new targeted queries each return the intended resource in the top five and within its category filter; all six actually return it first. Unknown-query and inferred-relationship exclusion checks pass. Existing engine routing, shard, fallback, scope, retry and 3D destination model checks pass. Deterministic index/shard validation passes. New source-adapter/index tests were run separately; see their execution log for exact count.

The actual 12-case ecosystem report and six new query results are saved in ecosystem-search.json and project-resource-search-017.json. Timings include cold index preparation and are local measurements, not a production SLA. No browser/mobile visual review was performed and no URL is claimed deployed by this build.

## Preserved and remaining

Checkout/Cash/Plus test integration from Builds 015–016 is retained, and Space remains on its separate branch with saved databases. Homepage, Store, Blog, menu and scene behavior were not redesigned.

The broader handoffs remain unfinished: secure hosted previews, Cloudflare account/deployment inspection, World source/export reconciliation, provider-backed sandbox payments, cross-domain accounts, owner-authorized property workflows and visual QA. Search coverage is still a seed index with gaps; no live crawler or complete Solana directory is claimed. Continue source-backed expansion and preview verification alongside infrastructure work.
