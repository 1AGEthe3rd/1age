# 1AGE Work Session 002 review builds

Unpublished, nonfinancial prototypes. No real payment provider or card entry.

From the repository root:

```bash
python3 services/checkout/server.py
```

Open **http://127.0.0.1:4180/experiences/**. This starts a loopback-only server with the SQLite mock backend. Use Store for the showroom, Blog for the visual journal and Checkout for order simulations. Plus is at `/experiences/plus/`. Default production hostname links still open public domains, so use the review hub for local navigation.

The original 1age.com homepage is preserved in this branch. The local review server intentionally serves only `/experiences/` and `/assets/`; to preview the full homepage too, use a separate static server such as `python3 -m http.server 4181 --bind 127.0.0.1` from the repository root, then visit `http://127.0.0.1:4181/?preview=commerce`. That static server has no payment API; the terminal will clearly label its browser-only simulation. Never expose the repository static server or the development API publicly.

Run the tests:

```bash
python3 -m unittest discover -s tests/commerce -v
node tests/app-entrypoints.test.cjs
```

Prepare independent frontend packages:

```bash
python3 scripts/build-commerce-apps.py --out /tmp/1age-commerce-review-builds
```

The output directory must not already exist. Each package contains an independent app, shared viewer assets and a checkout demonstration. It contains no backend, signing key or database. Public-domain navigation in those packages is intended for eventual approved deployment, not proof those domains have been updated.

Blog publishing uses `blog/publications.json`: id, title, ISO date, type, status, media, description, body paragraphs and technical/source information. Supported curated media: `procedural` model identifiers, same-origin uncompressed `gltf`/GLB, `image`, and `video`. No public upload facility exists. Video support is implemented but no approved video fixture is supplied. Compressed or extension-dependent glTF assets need corresponding reviewed decoder support.

See `docs/session-002/DEVELOPMENT_REPORT.md` and `PAYMENT_INTEGRATION_PLAN.md` for actual capabilities, provider setup and production gaps.
