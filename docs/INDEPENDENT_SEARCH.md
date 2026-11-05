# Independent multichain search — Build 001

Historical initial release. See [Automatic indexing](AUTOMATIC_INDEXING.md) for
the current daily-indexing development build, expanded coverage and shard loading.

1AGE owns the catalog and search implementation. No search provider, API key,
subscription, analytics service or backend is required. Searches execute in the
visitor's browser, using the MIT-licensed MiniSearch 7.2.0 vendored in this repo.
The existing homepage icon, expanding field and results overlay are reused.

## Actual coverage

42 resource records: 11 existing 1AGE ecosystem listings, 5 existing Solana
listings with refreshed public-source checks, and 26 new network, project,
community, identity-service, explorer and developer-resource listings.

Eight networks are represented: Solana, Ethereum, Bitcoin, Base, Polygon,
Arbitrum, Optimism and Avalanche. Network associations are conservative metadata,
not an exhaustive claim about each product's supported networks. Some listings
have no confirmed network association and remain discoverable by name/category.

31 records have public-source checks dated November 4, 2026, with source URLs
in the data. A checked public source is **not** ownership verification, a security
audit, a financial endorsement, or proof that a linked application works.
The UI retains 'Unverified listing'. Original 1AGE listings are preserved;
some destinations still depend on their own deployments. No founder identities,
wallet ownership, Discord messages, private profiles or live prices are inferred.

Sources are project-published pages, documentation and public resource hubs:
Solana, ethereum.org, Bitcoin.org, Base, Polygon, Arbitrum, Optimism, Avalanche,
ENS, SNS, MetaMask, Uniswap, OpenZeppelin, Hardhat, Foundry, Solscan, Blockstream,
Jupiter, Phantom, Helius, Backpack, Superteam, Star Atlas, Skyweaver and OpenSea.
Metadata summaries were authored for this catalog, not bulk-copied page text.
Exact provenance is stored per record; the existing ecosystem listings are
first-party catalog entries and have no new verification badge.

## What works

- Exact names, aliases, domains and identifiers lead results.
- Prefix matching and limited typo tolerance (terms of at least four characters).
- Multiple query terms must match across indexed fields; e.g. Ethereum wallet.
- Field weighting: name/id/identifiers > domain/aliases > network/category/tags
  > description. Ties use source-check date, field completeness, then name.
- No ecosystem-ownership ranking boost and no sponsored rankings.
- Current application search scopes remain intact; 1AGE's main search covers all.
- Twenty results per batch, with an explicit Show more control.
- Lazy loading of both the local engine and the catalog when search is used.
- In-memory caching, failure retry, empty/no-match messages and stale-request
  protection when closing results or searching again.
- URLs use the existing safe-link handling; rendered metadata uses textContent.

## Rebuild and validate

Edit the authored entries in `data/blockchain-seeds.json`. Existing listings
remain in `data/1age-index.json` and `data/entities.json`. Supplement existing
metadata through `data/search-overrides.json` without duplicating records.

For each addition, inspect the publisher's public website/docs, write a short
factual summary, record the evidence URL/date, and leave authenticity unverified
unless separate documented evidence actually establishes a stronger status.
Do not add private identities or associate wallets with people without evidence.

Run from the repository root:

```sh
python3 scripts/build-search-index.py
python3 scripts/build-search-index.py --check
node tests/search.test.cjs
```

The deterministic offline builder validates required fields, HTTPS URLs,
source dates/evidence, duplicate IDs and duplicate destinations. It writes
`data/search-index.json` and `data/search-manifest.json`. It never changes a
review date or verification status automatically. URL syntax checks do not prove
that a remote destination remains reachable.

The included read-only GitHub Actions workflow checks pull requests touching
search inputs and supports manual dispatch. It does not publish or commit
updates. Include edited seeds and regenerated output in a reviewed Git change;
after approval/merge, the existing GitHub Pages deployment serves the files.
No deployment configuration or domain changes are needed.

## Budget and limits

- $0 incremental search-service charges. No 1,000-query cap or paid API fallback.
- Existing GitHub Pages bandwidth, repository and build limits still apply.
- GitHub Actions availability/quotas depend on repository/account settings.
- The search engine is local after loading, but first use requires the catalog
  and engine to download. There is no added offline service worker.
- The vendored engine is about 86 KB uncompressed; the starter index about 21 KB.
  It uses no runtime CDN. Browser memory/CPU grow with the catalog; shard indexes
  or move indexing/search to a worker/backend when measured scale requires it.
- No crawler, automatic discovery, live market feed, transaction lookup, wallet
  balance lookup, ENS/SNS resolution or public-profile ingestion is included.
  Finding ENS/SNS finds those services, not every .eth/.sol account.
- Records can go stale. Source-check dates represent the documented manual check;
  build validation alone does not refresh those dates or establish authenticity.

## Next work

Add a reviewed source-admission list and a bounded metadata/link-health updater.
Respect source terms, robots rules, rate limits and licenses. Report broken links
and duplicates for review; never award verification from a successful HTTP fetch.
Then add opt-in public 1AGE Page identities, public name-record resolution,
network/category filters, submissions and index sharding as coverage grows.
Scheduled discovery/update publishing is intentionally not enabled yet.

## Validation

Automated checks exercise exact/prefix/typo/AND ranking, network and application
scopes, no ownership boost, no eager fetch, data caching, safe destinations and
recovery from failed fetches. Desktop and mobile browser QA results are recorded
in the accompanying implementation handoff. No production deployment is part
of this development change.

Browser QA completed at 1280×600 (laptop) and 390×844 (mobile-sized frame):
Ethereum wallet → MetaMask; phantm → Phantom; Ethereum → 11 results;
unknown name → explicit no-match message; game in Games → three scoped results.
A broad query rendered 20 of 37 matches, then Show more rendered all 37.
Mobile measured 390px content/scroll width with no horizontal overflow and kept
the ticker's mobile display enabled. Search library was absent before opening
search, then loaded successfully on use. These are browser viewport tests,
not performance measurements on the founder's physical devices.
