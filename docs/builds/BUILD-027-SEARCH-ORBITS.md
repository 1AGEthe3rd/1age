# Build 027 — searchable, paged 3D connections

Branch: `feature/search-orbit-paging-027`.

## Source preservation and integration

The resumed execution environment contains Build 023 (`c9ec583421742a736d88d3f3c1f77e73ef3e98b9`). The Build 024–026 folders, bundles and commit objects reported in the preceding turns are absent from this restored workspace. No existing branch or deployment was replaced to force recovery.

This build is an isolated, additive Search change based on the available Build 023. Its one-commit patch should be applied to the latest recovered source, including Build 026, with normal conflict review. Do not use this branch as a wholesale replacement for that newer source. No publication, hosting migration or DNS change is performed. The independent Space repository, geographic databases, World export, official assets and payment services are untouched.

## Implemented

- The public destination data model can return all checked relationships. Its existing default remains 16 for compatibility.
- The 3D explorer pages through all available destinations, displaying at most 16 spheres at once. The accessible destination buttons use the same current page and selection as the scene.
- Destination-type filtering resets to the first page, reports the actual count and keeps all matching destinations accessible through paging.
- Selected sphere highlights and destination links update together. Page changes dispose old sphere/caption geometry, materials and textures before rebuilding.
- Plus/minus keyboard zoom joins existing arrow-key rotation and Home reset. Pager focus moves to an enabled control at page boundaries.
- Unsafe relationship-source URLs are omitted from evidence links using the existing HTTPS destination policy.
- Search CI now includes the orbit files in its change filter and runs the new paging/UI checks. No workflow was pushed or run remotely.

## Verified

- Existing orbit model tests passed, including unsafe URL rejection, provenance and person deduplication.
- New paging model checks passed: 42 synthetic destinations are reachable once across 16/16/10-item pages; filtering, page clamps, empty states and scene budgets behave correctly. These are fixture counts, not added indexed entities.
- The actual dialog module was exercised with a minimal DOM and no WebGL context: accessible fallback, paging, filtering, selected links, focus recovery and close cleanup passed.
- The actual stored catalog currently yields 9 connected destinations for Solana, 4 for Jupiter, 5 for Helius and 3 for Phantom. This is verified relationship-link coverage, not the broader search-result count.
- All 40 search-quality queries passed against 324 unchanged indexed records.
- All 12 ecosystem-search scenarios passed, including the broad Solana query (106 results), a public person, community, grant, game, typo and empty result.
- Search engine checks and index/shard consistency checks passed.
- JavaScript syntax and Git whitespace checks passed.

## Rendering limits

A real local Chromium smoke test was prepared, but it could not run: `/usr/bin/chromium` points to an unavailable launcher in this restored environment. No WebGL rendering or physical device success is claimed. `python3 tests/orbit-browser-smoke.py` can verify scene creation, paging, filtering, selected links, camera actions and cleanup when an executable Chromium is installed. It opens a loopback test fixture only and does not visit external destinations.

Before publication: apply the patch to the latest recovered branch, rerun tests there, review the real WebGL view on mobile and desktop, and confirm no hosting changes enter the release.
