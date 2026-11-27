# Domain cutover register — 1AGE ecosystem
Founder requirement: each application opens its own 3D environment directly at its assigned domain (App is the approved distribution-center exception). Preserve 1AGE.com Enter and homepage dial, original World, HQ scenes, NLC and NNB. This is a release register, not an active routing change or DNS configuration.

- 1age.page — root_entry_staged — https://github.com/1AGEthe3rd/1agepage/pull/7
- 1age.space — root_entry_staged — https://github.com/1AGEthe3rd/1age-space/pull/20
- 1age.games — root_entry_staged — https://github.com/1AGEthe3rd/1age-games/pull/4
- 1age.exchange — root_entry_staged — https://github.com/1AGEthe3rd/1age-exchange/pull/3
- 1age.cash — root_entry_staged — https://github.com/1AGEthe3rd/1age-cash/pull/9
- 1age.quest — root_entry_staged — https://github.com/1AGEthe3rd/1age-quest/pull/4
- 1age.shop — root_entry_staged — https://github.com/1AGEthe3rd/1age-shop/pull/3
- 1age.store — root_entry_staged — https://github.com/1AGEthe3rd/1age-store/pull/3
- 1age.plus — root_entry_staged — https://github.com/1AGEthe3rd/1age-plus/pull/5
- 1age.app — root_entry_staged — https://github.com/1AGEthe3rd/1age-app/pull/3
- 1age.blog — root_entry_staged — https://github.com/1AGEthe3rd/1age-blog/pull/3
- 1age.design — root_entry_staged — https://github.com/1AGEthe3rd/1age-design/pull/3
- 1age.work — migration_required — https://github.com/1AGEthe3rd/1age/pull/28
- 1age.forum — migration_required — https://github.com/1AGEthe3rd/1age/pull/30
- 1age.autos — migration_required — https://github.com/1AGEthe3rd/1age/pull/31
- 1age.services — migration_required — https://github.com/1AGEthe3rd/1age/pull/33
- 1age.pics — migration_required — https://github.com/1AGEthe3rd/1age/pull/34
- 1age.online — migration_required — https://github.com/1AGEthe3rd/1age/pull/35
- 1age.lol — migration_required — https://github.com/1AGEthe3rd/1age/pull/36

## Release gates
1. Review every branch against latest main, reconcile parallel PRs, validate all static assets and imports and run browser/mobile/controller tests. Preserve original application.html and deep links. Cash account.html compatibility needs identity callback verification; never enable payments, registration, redemption or checkout by this cutover. Plus billing remains test-only and price undecided.
2. For the seven missing dedicated repositories, create one approved standalone repository per domain; copy only that application's prototype and required versioned shared assets, rewrite relative imports for its new directory, stage root with base ./spatial/, configure Pages and the verified custom domain. Do not merge temporary prototype PRs into 1AGE.com. No repo creation action was available to this session.
3. Existing twelve repositories already contain intended CNAME files, but that is not DNS/HTTPS or deployment verification. Review actual hosting settings and DNS records; never replace name servers or mail records. Verify TLS and the correct deployed commit before declaring live.
4. Coordinate the World geographic web and Godot source releases after independent domains are working. Preserve compiled production export until matching source lineage and working export are verified. Forum gateway remains disabled until its destination exists; add remaining app gates only with approval and verified routes. HQ1/HQ2 are reserved World destinations, not public Space rentals. Do not migrate their hosted URLs or venue doors without separate review.
5. Preserve homepage Enter link and dial. Coordinate Homepage Earth PR #32 and Blog dial PR #29. Do not merge or deploy these changes automatically.
6. Verify all direct domain entries, legacy paths and venue returns; record production commits, screenshots, real test results, and rollback checkpoints. No proposed Live domain or native application binary is assumed purchased or released.

## Build 024 readiness audit
- All 12 root candidates re-read from the actual development branches; all 12 branches were ahead of and not behind their main at audit time. Root base paths resolve to spatial/ or distribution/. This is a static source check, not browser or deployment verification.
- Seven migration source branches verified to contain only their own prototype additions. Pinned source commit IDs are recorded in the JSON register. `package-standalone.mjs` prepares a new local directory for one application, rewrites only shared dependency paths, copies the local 3D engine/controller/texture/logo files, creates the root entry and CNAME, checks explicit local imports/assets, and refuses to overwrite. It performs no network requests or GitHub mutations. It requires the source commits in a local Git clone and has not been executed in this session. Review third-party license notices before release.
- Space PR #20 now includes a shared client-side reservation guard covering explicitly reserved HQ/studio identifiers, existing protected records, and the NorthLeftChef template. The catalog no longer offers the reserved record's customization, claim or inquiry actions. New automated fixture cases are authored, not yet run; database enforcement and complete verified reservation boundaries still required. City geometry, venue doorways and indexed catalog data unchanged.
- Cash preserved account.html must still be verified with the actual identity callback and API integration. Blog still uses pinned remote rendering dependencies; browser network verification remains pending.
- Next founder action: create the seven dedicated repositories or authorize an available repository-creation workflow. No repo creation action was exposed in this session. Do not change DNS yet.
