# Daily automatic indexing — Build 002

This extends the existing 1AGE.com search engine. It does not replace the website,
change its layouts, create a separate project, or add a paid service.

## Implemented and tested

The first real import expanded the catalog from **42 to 85 searchable records**:
43 new records, five duplicate destinations merged, and five curated records
enriched with attributable registry identifiers/aliases. The next live run added
zero duplicates/new entries, refreshed source observations, reused six ETag
caches, and confirmed 17 destination links reachable. Seven link checks were
inconclusive because this development environment could not retrieve their
robots policy. Those checks are not reported as successful or as broken links.

There are now 16 represented networks: Solana, Ethereum, Bitcoin, Base, Polygon,
Arbitrum, Optimism, Avalanche, BNB Chain, Gnosis, Fantom, ZKsync Era, Polygon zkEVM,
Celo, Linea and Scroll. Network labels are source associations, not an exhaustive
assertion about every repository's runtime compatibility.

Browser QA at 1280×600 and 390×844 confirmed newly discovered records searchable
through the original expanding search control. Website styles, globe rotation,
planet navigation, application portals and ticker implementations are unchanged.

## Initial source policy

`data/index-sources/config.json` explicitly admits these sources:

| Source | Data admitted | Initial bound |
| --- | --- | --- |
| ethereum-lists/chains exported `chainid.network/chains_mini.json` | Network title, public info URL, chain ID, alias | 14 reviewed chain IDs |
| GitHub `solana-program` organization API | Public developer repositories | Up to 8 eligible entries/run |
| GitHub `ethereum` organization API | Public developer repositories | Up to 8 eligible entries/run |
| GitHub `bitcoin` organization API | Public developer repositories | Up to 8 eligible entries/run |
| GitHub `base` organization API | Public developer repositories | Up to 8 eligible entries/run |
| GitHub `0xPolygon` organization API | Public developer repositories | Up to 8 eligible entries/run |

The registry is MIT-licensed; its unmodified notice is retained in
`data/index-sources/chains-LICENSE.txt`. Each record carries attribution and a
source/license or terms URL. GitHub data comes from its documented public
organization-repository API under GitHub's API terms. No repository source code,
README contents, contributor lists, email addresses or private profiles are
copied. Repository-license metadata is informational, not a claim that all
imported projects share one license.

Only public, non-fork, non-archived repositories from the configured organization
are eligible. The destination must exactly match its GitHub owner/repository URL.
Developer **organizations and repositories** are discoverable; this is not a
search index of individual developers, creators or wallet owners.

New records remain **unverified**. Source retrieval never awards a human review,
verified identity, financial safety score or security guarantee. Suspicious claim
keywords are held for review; they are heuristics with possible false positives,
not scam determinations. Existing curated descriptions/verification take priority
when the same destination is discovered through another source.

### Not connected yet

No ENS/SNS name enumeration or resolution, opt-in 1AGE Page public-profile feed,
DAO/Discord discovery feed, personal identity matching, wallet balances,
transaction histories or token-price feeds are enabled. The source configuration
lists these as disabled instead of pretending they work. The schema supports
public identifiers, namespaces, provenance and future opt-in identity adapters.
A real published feed, license/terms check and privacy/correction policy are
required before enabling personal-profile discovery.

## Daily workflow

`.github/workflows/daily-search-index.yml` schedules a run once daily at 09:23 UTC.
GitHub may delay/drop scheduled runs; its public-repository inactivity rules also
apply. Manual **Run workflow** is available. The workflow must be merged into the
default branch before its daily schedule can start.

1. Retrieve the configured JSON/API sources with timeout/response-byte limits.
2. Send ETags and use conditional 304 responses to avoid needless downloading.
3. Admit eligible records; preserve old records if a source fails or omits them.
4. Normalize destinations, coalesce duplicate URLs and reject conflicting IDs.
5. Rotate through up to 24 destination checks, oldest observations first.
6. Validate schema, provenance, record/byte budgets and change thresholds.
7. Generate the full catalog, query-routed immutable shards and report.
8. Run Python/JavaScript behavior and integrity checks.
9. Save reports and a validated candidate as GitHub Actions artifacts.
10. On reviewed `main`, publish eligible scheduled runs through the existing
    GitHub Pages branch-build mechanism.

Manual runs default to **publish=false**. A run on a development branch cannot
publish even if that checkbox is selected. After reviewing and merging this
implementation, the owner can run it on `main` with **publish=true** to verify
the end-to-end GitHub/Pages path immediately; future scheduled main runs publish
automatically. No new secret or paid subscription is required.

### Publication protections

The publishing job has `contents: write` and `pages: write`; the data-collection
job has read-only repository access. Its normal GitHub token may authenticate
only GitHub API requests, and is never sent to third-party destinations or saved
in the cache. No personal access token is requested.

The publisher revalidates the artifact against the current reviewed source.
If main advanced while indexing, it stops instead of overwriting/rebasing it.
Only the explicit generated data/report paths can be committed. A normal push
preserves branch protections: required-review rules can block automatic pushes;
there is no bypass. In that case, keep manual review or adapt the data publication
path to PRs in a subsequent approved change.

The existing Pages source must be `main` at `/`, using branch publishing. The
publisher checks this with the Pages API **before pushing**. It never alters
Pages settings or moves the website to another host. If the source differs or the
API is inaccessible, it fails with the candidate/report preserved for inspection.

GitHub-token pushes do not trigger Pages builds. The workflow therefore explicitly
requests a Pages build after its data commit and checks for completion of that
commit. A request alone is not reported as a completed deployment. API permissions,
branch rules and this actual repository's Pages configuration still require an
owner-run Actions check; no production deployment was performed in development.
The unauthenticated Pages-configuration lookup returned 404 in this environment,
so the publishing guard is intentional and the hosting configuration is not assumed.

## Local commands

No dependencies beyond Python 3 and Node are required:

```sh
python3 scripts/update-search-index.py
python3 scripts/build-search-index.py --check
python3 -m unittest discover -s tests -p 'test_*.py' -v
node tests/search.test.cjs
python3 scripts/search-report.py
```

The initial `--bootstrap` import was performed locally for review. It relaxes
only initial growth/change thresholds and is forbidden in GitHub Actions. Regular
runs enforce all limits. `--skip-links` is a discovery-only local diagnostic; the
scheduled workflow does not use it.

## Last-good behavior and rollback

A total source failure, malformed output, conflicting identifier, unexpected loss,
excessive growth or byte/record-budget failure leaves the working catalog and
last-successful state untouched. Only the attempt report changes. Partial source
failures preserve that source's previously valid records and mark the report
partial. Omission from a changing API page is not interpreted as deletion.

Destinations are never automatically replaced for an existing ID. Deletions require
an explicit owner-managed exclusion. A temporary outage never removes a project.
HTTP 403/429, unavailable robots directives and failed DNS lookups remain
inconclusive. Two 404/410 observations separated by at least 20 hours flag a link
for review; they do not prove a project is abandoned or dishonest.

`data/index-rollback.json` stores the previous automatic records, link health and
state. `data/search-last-good.json` stores the previous complete valid catalog.
To restore a snapshot **locally**:

```sh
python3 scripts/update-search-index.py --rollback
python3 scripts/build-search-index.py --check
```

Review, commit and publish the restored generated files using the normal owner
workflow. Existing Git history is another recovery path. Rollback does not force
push, reset Git, delete backups or automatically publish. Archived immutable shard
files are retained for older cached manifests; they are not pruned automatically.

## Public data structure and corrections

`data/discovered-records.json` contains automatic records. Each has an ID, name,
description, category/type, networks, destination, aliases, public identifiers,
source ID/provenance, discovered time, last-seen time, meaningful-metadata-update
time and `verification_status: unverified`. Legacy records have null discovery or
update timestamps where that historical date is unknown; dates are not invented.
Timestamps in machine files are UTC. Local UI dates use the browser's locale.

`data/index-exclusions.json` suppresses IDs/destinations from search, including the
same destination rediscovered under another source ID. It provides an owner
correction/removal mechanism, not a complete personal-data deletion system.
Public Git history/raw catalogs may retain source metadata. Personal-profile
indexing remains disabled pending an appropriate consent/removal design.

## Query performance

The initial routing manifest is about 8 KB and contains field vocabulary per shard.
Opening search prepares only this manifest and the existing vendored engine.
Submitting a query retrieves matching source shards, with the same prefix/typo/AND
matching semantics as full-catalog search. Tests compare routed results with full
results to detect omissions. Materialized query combinations and fetched shard
files are cached in the browser; no visitor query is sent to the indexed sources.

The full 85-record catalog is about 73 KB uncompressed, and is normally reserved
for validation or recovery if a shard fails. The browser can fall back to the full
current catalog and then the previous good snapshot. There is no server search API
or added query quota. Source/date/review metadata uses the existing results cards.

## Operational limits and $0 target

- Standard GitHub-hosted Linux runners in this public repository; no larger runner
  or paid service is configured. API, cache/artifact storage, Pages bandwidth and
  repository constraints still apply. Monitor account usage; no paid fallback is
  automatically enabled.
- Unauthenticated GitHub API allowance is 60 requests/hour/IP. Actions can use its
  scoped GitHub token for the configured public metadata endpoints. Rate limits
  cause preservation/failure, not retries through alternate identities.
- One source request at least one second apart, 12-second timeout, one retry for
  transient 5xx/network failures; no retries for 403/429 restrictions.
- Maximum 3 MB per source response; 600 KB catalog; 300 records initially.
- At most 25 new records/run, and a large metadata-change guard. Growth beyond
  these initial safety budgets stops for owner review/configuration changes.
- Organization sampling is one page of up to 100 public repositories, ordered by
  recent updates; up to eight eligible entries/source/run. This does not enumerate
  every blockchain project, and old sampled records are retained.
- Link checking is a rotation, not proof every URL was checked every day. Robots
  policies are respected. A proxy/DNS fallback exists only for the fixed public
  registry/GitHub hosts; arbitrary catalog hosts must resolve publicly.
- Immutable shard/history and source caches consume storage over time. Reports
  expire from Actions artifacts after 14 days, candidates after seven; the latest
  report is tracked in Git. Review retention/storage before expanding the catalog.

## Reports and tests

`reports/index-latest.json` is the last successful/partial run.
`reports/index-latest-attempt.json` also records failures. They contain total/new/
updated/duplicate counts, broken-link observations, actual vs attempted link
checks, review flags, successful/failed sources, last successful indexing time and
request/cache usage. The Actions Summary renders those results; failed jobs retain
reports as artifacts. The publisher separately confirms the deployment outcome in
its job log. No external monitoring or messaging service is configured.

Python tests cover discovery/refresh, duplicate coalescing, malformed/suspicious
source handling, total/partial failures, growth limits, conflicting identifiers,
removal, rollback, public-destination restrictions, ETag reuse and tampered
artifacts. JavaScript tests cover ranking/scopes, lazy routed loads, equivalence,
cache/retry and fallback behavior. Browser checks cover an imported Bitcoin
repository on desktop and imported BNB metadata on mobile without horizontal
layout overflow. GitHub's scheduled execution and production publishing remain
unverified until the owner runs the reviewed workflow.

## Reference documentation

- https://github.com/ethereum-lists/chains/blob/master/LICENSE
- https://docs.github.com/en/rest/repos/repos#list-organization-repositories
- https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api
- https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- https://docs.github.com/en/rest/pages/pages#request-a-github-pages-build
- https://docs.github.com/en/actions/concepts/security/github_token
- https://docs.github.com/en/actions/concepts/billing-and-usage
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
