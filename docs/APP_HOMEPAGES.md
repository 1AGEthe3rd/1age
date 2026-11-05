# Shared app homepages

The canonical homepage, globe, dial, ticker and search stay in the `1age` repository. Twelve generated `/home/<app>/` routes use the original `index.html` template and shared scripts. The eleven separate app domains redirect to the corresponding route; the browser address changes to `1age.com/home/<app>/`. This keeps all applications on the same live search catalog and eliminates divergent homepage copies.

`data/app-domains.json` maps the eleven public app repositories and domains. World has a canonical `/home/world/` route, but no public World hosting repository was identified. Its private Godot repository is not deployed by this rollout.

## What is included

- Matching titles (`1AGE Games`, `1AGE Page`, etc.), short header labels, metadata and canonical URLs.
- Existing approved planet icons, with black circular SVG and PNG favicons. Applications without a separate approved mark retain the real 1AGE logo.
- App-specific navigation, a 1AGE home planet, scoped search, the existing rotating World globe and current responsive ticker.
- Existing application workspaces, now with matching favicon and shared search/home controls. These remain local browser workspaces; no multiplayer, payment service or shared profile backend is implied.
- Two previously unlisted, existing workspaces (App and Store) added to the search catalog. This candidate contains 96 records / 16 networks; historical indexing reports are unchanged.
- Separate domain patches preserve CNAME files, deployment workflows and all original non-homepage content. Legacy page edits only update titles and icon metadata.

## Regeneration and validation

Run from the repository root:

```bash
python3 scripts/build-app-icons.py
python3 scripts/build-app-homes.py
python3 scripts/build-search-index.py
python3 scripts/build-app-icons.py --check
python3 scripts/build-app-homes.py --check
python3 scripts/build-search-index.py --check
node tests/app-entrypoints.test.cjs
node tests/search.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

SVGs come from the actual existing homepage icons, not replacement artwork. If an approved SVG changes, regenerate its committed 96px PNG using Inkscape: `inkscape assets/app-icons/games.svg --export-type=png --export-width=96 --export-height=96 --export-filename=assets/app-icons/games.png`. Inkscape is a development tool only. Browser visitors need no new runtime dependencies.

After changing the root template, regenerate the app routes. The PR check rejects stale generated homepages. `build-app-entrypoints.py --output <staging-directory>` stages domain aliases without touching any repository or CNAME file.

## Publishing order and recovery

1. Review/merge the canonical `1age` update and wait for Pages success. Confirm `/home/games/` works before merging domain redirects.
2. Review/merge the eleven app entrypoint patches. Existing Pages configuration remains unchanged. No DNS settings are changed by these patches.
3. Verify each domain and its destination after deployment. Use a normal revert commit if rollback is needed; never reset or force-push main.

The provided publishing helper only creates and pushes development branches. It refuses changed bases, existing nonmatching branches and dirty worktrees. It never merges or deploys. GitHub connector branch writes returned 403 during preparation, so owner-authenticated Git is required for those pushes.

## Domain and World limitations

At the recorded audit, `1age.exchange` served a Namecheap expiration notice. Renewal is an owner action and may involve payment. Quest, Cash and World returned HTTP 503 from this environment; this does not establish the cause or their availability for all visitors. See `reports/app-domain-audit.json` for exact observations.

The World route opens the existing launch options. This release does not include a browser-exported 3D build or configure a native launcher on new devices. The main homepage's existing native World entry remains unchanged.

Google can retain older titles/icons until recrawling and may choose its own result titles. Correct metadata does not guarantee immediate search-result changes.
