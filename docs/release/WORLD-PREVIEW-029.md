# Build 029 — World export and domain preview preparation

The unchanged local World export validates its declared assets, WASM header and Godot package header. `index.wasm` is 39,514,754 bytes and exceeds the Cloudflare Pages individual-asset limit. Workers Static Assets also has a 25 MiB per-file limit. This is a reproduced packaging blocker, not proof of the historical 522 root cause.

A separate preview builder copies validated public export dependencies only and splits the unchanged engine into three <=16 MiB static chunks. A small Worker streams those chunks sequentially as the original `/index.wasm` URL, with the original byte length and WASM MIME type. It calls the local ASSETS binding and requires no unavailable origin. The original export, HTML configuration, engine bytes and PCK remain unchanged. No CNAME, account credentials or production routes are copied into this preview.

The artifact contains a preview-only Worker name, binding, isolation headers and noindex controls. This is source configuration, not a deployed Cloudflare project. Wrangler compilation, authenticated upload, real browser rendering/input, MIME/isolation checks on Cloudflare and practical mobile performance remain unverified. No paid resources were provisioned.

Verification: the actual 39,514,754-byte engine was reassembled from all three artifacts and matched its source SHA-256 `fc74679e3b97f76878947fcd4fbe1268cbfa6188182a2e33bbc3f5dc9bfa57d0`. Handler tests cover ordered streaming, WASM headers, HEAD, ETag, method limits, static fallback and missing-chunk failures. Fixture tests cover source preservation, export-only copying, manifest restoration and absence of production routes; the existing Godot export-validation tests are retained.

The independent app packager also emits 12 static-asset preview configurations without account IDs or custom-domain routes. The main Search deployment and dedicated Space application are not replaced by those configurations. The generic Space entrance remains explicitly labeled.

Sources checked November 22, 2026:
- https://developers.cloudflare.com/workers/platform/limits/#static-assets
- https://developers.cloudflare.com/pages/platform/limits/#file-size
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/

Preparation only: `python3 scripts/build-world-preview.py --source /path/to/export --out /new/path/outside/export`. This command never deploys and refuses existing output.
