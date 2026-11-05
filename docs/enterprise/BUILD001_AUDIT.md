# 1AGE Enterprise — Search Infrastructure Build 001

Status: implemented development candidate, not approved or deployed. Public branding remains 1AGE; everyday search remains free. Work is on `feature/enterprise-search-001`, preserving the pending app-home and World Enter changes underneath it.

## Audit and root causes

The verified live baseline is `eadfc04`, with 94 records across 16 networks. It has MiniSearch, lazy immutable source shards, curated records and a working daily Actions pipeline. The pending app candidate added two existing workspace records, making 96 before this build.

- Upland was absent from the catalog. Exact matching cannot retrieve an unindexed game.
- Both shard selection and document matching combined every query word with AND. Words such as “top” and “projects” caused empty shard selection. A valid empty shard selection did not trigger the network-error catalog fallback.
- Results only appeared after submission. There were no live results while typing.
- Source coverage mainly comprised chain metadata and small samples of five GitHub organizations, with a conservative 300-record ceiling. Developer repositories are not a consumer dapp directory.
- Ranking boosted exact names/identifiers and keywords, but did not interpret everyday phrases. Community directories and naming-provider pages were indexed, not all public people, accounts or naming records.
- The backend was a batch index generator and static files; there was no reusable DOM-independent query module or hosted Enterprise API.

These findings explain the two reported queries. They do not establish that every possible empty query on the owner's device had the same cause.

## Implemented architecture

| Layer | Implementation | Reuse |
| --- | --- | --- |
| Source adapters | `scripts/source_adapters.py` | Source-specific metadata acquisition; provenance and unverified imports |
| Transport | `scripts/index_http.py` | Cached JSON, retries, limits, public URL checks, robots-aware HTML/link retrieval |
| Catalog | `scripts/indexlib.py` | Shared schema validation, canonical URLs, deduplication, exclusions, static generation |
| Query engine | `search-core.js` | Pure JavaScript query interpretation/ranking; browser and Node, no DOM/network |
| Browser loader | `search-index.js` | Lazy vendored MiniSearch, manifest routing, cache and fallback |
| Interface | Existing `search.js` and search control | Same layout; results update after 220ms while typing; submit remains available |
| Command interface | `node scripts/search-cli.cjs "top Solana projects"` | Machine-readable JSON using exactly the same engine/catalog |
| Scheduled pipeline | Existing daily/search-check workflows | Same schedule, manual run and guarded publication; adds quality regression gate |

No new framework, paid search API, live wallet connection or server is required. A hosted authenticated Enterprise API is a future adapter around this engine, not a service claimed deployed today. It will need authentication, quotas, tenancy, deletion propagation and monitoring before third-party production use.

The query planner removes conversational filler, normalizes explicit synonyms/plurals, and applies the same interpretation to shard routing and matching. Useful terms and unknown identifiers remain conjunctive, so nonsense appended to a real project name does not produce unrelated fallback results. Exact raw names/identifiers still lead; ordinary project discovery focuses on project records rather than network definitions/software documentation. “Top” means relevance, not an invented popularity, safety, TVL or investment ranking.

## Source inventory and actual coverage

| Source | Access/attribution | Candidate result |
| --- | --- | --- |
| Curated official resources | Existing sources/evidence; unverified identity | 45 retained records, including Upland added from its official guide |
| DefiLlama `/protocols` | Documented free, no-key public endpoint; attribution retained | 200 eligible imports capped; 180 survive catalog deduplication |
| ethereum.org documentation topics | Public GitHub contents API, MIT repository; license included | 30 new documentation records |
| EVM chain registry | Existing MIT ethereum-lists/chains source | 9 source-owned records after cross-source merges |
| Five GitHub organizations | Existing public metadata adapters, source attribution | 44 retained source-owned records across organizations |
| Solana ecosystem HTML hub | Bounded same-host links; requires available robots permission | Blocked in this environment; zero hub imports, reported explicitly |
| Ethereum HTML hub | Same bounded robots-aware policy | Blocked in this environment; zero hub imports |
| Solana structured company registry | Identified official repository with GPL license | Not imported; reuse/license treatment needs evaluation |
| DappRadar | Documentation retrieval failed during research | Not integrated; no assumption of free bulk redistribution |
| Public 1AGE Page / identities / communities | No deployed opted-in profile feed or configured provider | Disabled; no private profiles, Discord messages, wallet-person inference or fabricated verified people |

Final catalog: **308 records / 17 network labels**. It contains project/application metadata and documentation topic links, not full blockchain transaction histories or a complete web crawl. This is a material first expansion, not comprehensive blockchain coverage.

Official source references:
- https://api-docs.defillama.com/ (free protocol endpoint documentation)
- https://api.llama.fi/protocols
- https://github.com/ethereum/ethereum-org-website/tree/dev/public/content/developers/docs
- https://github.com/ethereum/ethereum-org-website/blob/dev/LICENSE
- https://solana.com/ecosystem
- https://ethereum.org/
- https://guides.upland.me/getting-started/basics
- https://docs.opensea.io/reference/mcp (supported-network evidence; no API key requested)

## Manual indexing run and protections

The local bootstrap produced 308 records, 210 newly admitted records relative to the immediately preceding local candidate, 25 duplicate detections, eight completed HTTP requests, five conditional-cache hits and about 10MB of source responses. Two HTML hubs failed their robots-availability gate; their prior records were preserved. See `reports/index-latest.json` for the exact report.

This initial reviewed import used local `--bootstrap --skip-links`: no website, main branch or scheduled run was published. Destination link checking was **not** run during this bootstrap. Existing rotating robots-aware link checks remain enabled for normal daily runs; endpoint retrieval and schema validation do not prove every destination works or is safe.

Schedule remains approximately every 24 hours at 09:23 UTC, with manual dispatch. Source failures preserve old records. Existing source omissions do not erase records. IDs/URLs are deduplicated, suspicious changes are blocked or reported, generated data is validated before writes, and last-good/rollback state remains available. The growth limit remains 25 new records per normal run; a source expansion exceeding that threshold stops for review rather than silently publishing. Limits now allow 1,000 total records, 12MB per source response and a 2.5MB catalog. The actual catalog is about 244KB, with a roughly 22KB routing manifest. Browser downloads remain lazy.

After owner approval, the existing publisher revalidates the candidate against checked-out curated inputs, leases the expected main commit, updates only its permitted generated paths and checks Pages deployment. No deployment settings or DNS are changed. This build itself changes neither main nor production.

## Search quality and validation

`tests/search-quality-cases.json` defines **40 representative queries**: exact project names, aliases/typos, conversational/category/network queries, and five expected-empty cases. The captured production-baseline results passed **31/40**; the candidate passes **40/40**. The baseline fixture records its source commit and permits CI to run with shallow checkouts. The machine-readable results are in `reports/search-quality.json`.

Examples: Upland, Phantom, Jupiter, Star Atlas, Skyweaver, best Ethereum wallets, top Solana projects, find me wallets on Solana, Ethereum NFT marketplace, decentralized finance, and impossible identifiers.

This is a regression suite, not an independent industry benchmark or proof of accuracy for unseen queries. Broader blinded relevance judgments and coverage measurements are the next quality milestone.

Other checks: 16 Python tests cover original index failure/dedup/rollback/publication protections plus new source parsing, URL rejection and bounded hub discovery. Existing JavaScript tests cover lazy routing/full-catalog equivalence, ranking, scopes, retries and fallback. App entry checks and generated homepage checks remain. Browser QA checks the existing desktop/mobile interfaces, both reported searches, live results while typing, close/Escape behavior and mobile overflow.

## Public profiles and verification contract

Existing authenticity display can represent documented identity verification and independent review separately, but **none of the new automatic records receives those labels**. Imported source listings are unverified. Real public profile integration is blocked on a deployed opt-in feed; a wallet/naming record alone is not a verified real-world identity.

Before enabling a future profile source, require stable IDs, explicit public visibility and search opt-in, allowlisted public fields, evidence-backed identity relationships, timestamped provenance, and explicit opt-out/deletion tombstones. The current preserve-on-omission policy cannot itself implement consent withdrawal. Such a source must add and test deletion propagation before enablement. No private account fields or unsupported affiliations should enter the catalog.

## Cost estimate and limits

Incremental required service cost for this candidate: **$0/month** using the existing public GitHub repository/Pages, standard public Actions runners, vendored MiniSearch and the documented free API endpoints. Existing domain registration is outside this incremental estimate. No paid service, larger runner, account subscription or provider key was added.

Reference: https://docs.github.com/en/billing/concepts/product-billing/github-actions . Standard public runners are free; artifact/cache storage, external APIs, Pages traffic, scheduler behavior and rate limits remain bounded. The daily plan is about 30 batch runs per month; actual runtime/usage is recorded rather than promising unlimited capacity. A future hosted API or full-web/on-chain index needs a separate capacity/cost review and approval before paid infrastructure.

## Progress and next work

Completed: audit, reusable query core/CLI, everyday query matching, live results, Upland metadata, automated protocol/doc discovery, provenance, 40-query gate, source failure reporting and preserved scheduled publication protections.

Still needed: comprehensive gaming/consumer directories, additional approved network sources, full page-content extraction, deployed opt-in Page/community/naming feeds, identity proof/revocation workflows, objective popularity metrics if wanted, and an authenticated production Enterprise API. Robots-blocked hubs and unconfirmed DappRadar access are concrete source blockers, not silently substituted successes.

The review branch includes earlier unmerged app-home/Enter changes underneath this build. A full patch from current production must be reviewed as that combined website stack; it does not deploy the private World project. If those earlier branches merge first, refresh/rebase the candidate against the new main before applying it. Production publication requires explicit owner approval.
