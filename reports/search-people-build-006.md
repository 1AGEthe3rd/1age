# Search People — Build 006

Branch: `feature/search-people-006`. Based on `d371e36`, including the whole-row menu slider, earlier homepage repair, 3D Search, Cash test foundation, and spatial Store/Blog/Plus builds. Development only; no publication, DNS changes, or live payments.

## Implemented

The curated index now contains 318 records, up from 314. Four public professional records were added: Anatoly Yakovenko, Mert Mumtaz, Nicolas Pennie, and Liam Vovk. Descriptions are short original summaries; they omit private information, unverified accounts, and unsupported current job titles.

Sources checked November 21, 2026:

- Solana's published discussion identifies Anatoly as a co-founder and developer: https://solana.com/fr/news/anatoly-yakovenko-talks-decentralization-developer-community-at-udc-2021
- Helius identifies its three co-founders and describes their engineering work: https://www.helius.dev/about

People are linked to indexed Solana or Helius records with attributable relationships. Listings remain unverified identities; checking a public source is not account verification. These records link to publisher articles/team pages and do not create 1AGE Page profiles or imply account ownership.

The previous URL-only deduplication rule could not represent multiple people on one team page. For person records, deduplication now considers the normalized name alongside the destination URL; stable ID checks remain. Other record types retain existing URL deduplication. URL exclusions still apply to every record pointing to an excluded destination. This is not general cross-site identity resolution.

The 3D explorer keeps distinct person IDs even when their public evidence page is shared. Ordinary duplicate destination links remain collapsed. The existing maximum of 16 nodes and unsafe-link checks are retained.

## Verified

| Query | Results | Notes |
| --- | ---: | --- |
| Solana | 100 | 13 record types; Solana ranks first |
| Solana, People filter | 4 | All four sourced people |
| Solana developer | 18 | Tools, community, and people |
| Helius | 4 | Project plus three co-founders |
| Anatoly Yakovenko | 1 | Exact person match |
| Mert Mumtaz | 1 | Exact person match |
| Solana founder | 4 | Professional role discovery |
| Solana discord | 2 | Existing community results preserved |
| phantm | 1 | Existing fuzzy match preserved |
| zznonexistentzz | 0 | No fabricated fallback |

The report in `reports/ecosystem-search.json` also includes grant, game, platform, and wallet cases with local timing measurements. The broad query took approximately 32 ms in that run; this is a local engine measurement, not a mobile or network benchmark.

- Search-quality suite: 40/40 cases passed.
- Daily-index suite: 14 tests passed, including shared team-page preservation and duplicate-person rejection.
- 3D destination model checks passed, including three distinct Helius people sharing one source URL.
- Deterministic catalog/shard validation passed.
- Browser preview verified the four People-filter results, Helius relationships, a rendered 3D explorer, separate person selectors, and the selected person's source/destination link.

## Remaining handoff gaps

People coverage is an initial curated seed, not comprehensive ecosystem coverage. Additional creators and developers require attributable public sources. Person claim/verification, source refresh for these records, and robust cross-site identity resolution remain future work. Existing public submission/correction handling was not expanded in this build.

Cloudflare access and the matching latest World source remain unresolved. None of the Search changes depends on those blockers. Live provider checkout, production accounts, and real-money Cash remain disabled/unverified as previously reported.
