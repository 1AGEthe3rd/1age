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
