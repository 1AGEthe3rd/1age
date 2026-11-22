# Ecosystem Build 018 — Deployed private review and repeatable packaging

November 22, 2026. Branch feature/review-packaging-018. Existing application production deployments and DNS were not changed.

## Actual delivered review

A new owner-private review Site was created and deployed through managed hosting. Deployment returned succeeded, not merely created/pending.

- Review guide: https://oneage-ecosystem-review-018.remarkablecrow8.chatgpt.site/review/
- Search/home: https://oneage-ecosystem-review-018.remarkablecrow8.chatgpt.site/
- App paths: /experiences/store/, /experiences/blog/, /experiences/plus/, /experiences/cash/, /experiences/checkout/
- Project: appgprj_6b02f709ecb88191b584ef8cf5beff2d
- Deployment: appgdep_6b02f767b27481919940eae3ca81e0f1
- Saved version: appgprj_6b02f709ecb88191b584ef8cf5beff2d~appgver_22dd427ae8308191b9f1db0449d3a5d0
- Review source commit: 53500cb16978adf96ce085071bc00e547d950765, in the separate review repository.
- Application source represented: 8b6fb0072cbbd507acab2cf02cc69ced73ef1b59 (Build 017, including prior Plus/Checkout work).

This is an actual private hosted deployment of a review copy. It does not connect founder domains, replace 1age.com, fix the founder's existing Cloudflare account/project, or deploy the Godot World or Space backend. External navigation links can leave the review; the /review/ guide supplies local app-entry links. No production payment processing exists.

## Packaging and checks

Added scripts/build-review.py, which selects tracked static application assets, excludes CNAME and service/runtime files, refuses symlinks and existing output directories, adds disallow-indexing robots metadata and emits a hashed review manifest. Source is not rewritten. The separate review repository holds sanitized static output and its hosting manifest; no service code, local account databases, payment secrets or repository metadata are in the public static directory.

Added scripts/check-review.py for required entry pages, local HTML script/image/stylesheet asset references and forbidden runtime/source file checks. It checked six entry pages and 40 direct asset references, with zero missing dependencies or forbidden files. This is deliberately not a comprehensive JavaScript/CSS dependency graph, external-link audit, WebGL runtime test or security certification. Three unit tests passed for exclusion/overwrite protection, missing assets and symlink rejection.

The review contains 186 source-selected static files plus review metadata. Runtime APIs are absent. Cash/Plus authenticated test panels should report service unavailability here; a static host cannot run the Python account/payment backend. This is not evidence of an active membership, verified payment or shared cross-domain sign-in. Assets and loading were not visually reviewed in a browser in this build; deployment success is verified by the hosting service, not a mobile rendering test.

## Repeat locally

```sh
python3 scripts/build-review.py --out /new/empty/review/dist
python3 scripts/check-review.py /new/empty/review/dist
```

Use a new directory for each copy. For the existing private review Site, reuse the persisted project ID in review-018/.openai/hosting.json and preserve its owner-only audience; do not create duplicate Sites or change founder DNS. Deployment credentials must remain ephemeral and never enter source, manifests or reports.

## Next handoff tasks

1. Founder review and desktop/mobile visual checks against the private review URL.
2. Deploy a reviewed secure backend before advertising operational account/payment workflows.
3. Continue personal Cloudflare/World deployment repair when authenticated access is available; this separate managed review does not establish its root cause.
4. Provider-backed sandbox checkout, World controls/holograms and authorized Space owner/listing workflows remain incomplete.
