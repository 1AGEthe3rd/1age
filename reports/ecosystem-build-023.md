# Ecosystem Build 023 — 3D-default application entrances

November 22, 2026. Branch feature/virtual-app-entry-023. Not deployed; no domain/DNS changes.

## Founder direction

First-party application entrances are 3D-first. Practical controls for search, reading, account actions and checkout may remain ordinary accessible panels within the environment. A WebGL/JavaScript failure must not imply working 3D or hide essential controls. The existing 1age.com Search/homepage composition was not redesigned.

## Implemented source routes

Page, Games, Exchange, Store and Plus aliases now select their existing 3D experiences. Cash and Checkout receive full-screen 3D entrances with their existing account/order controls opened only by user action. Remaining registered legacy workspace entrances and generated /home/ routes use a full-screen shared 3D foundation rather than the old conventional page layout. The original tools remain in the DOM and open as a panel; legacy local storage and functionality are not migrated or deleted. Explicit workspace=1 bypasses an alias redirect while retaining the 3D surrounding entrance.

Generic foundations reuse the official brand geometry; Space's legacy entry uses a clearly generic property model, and Cash/Checkout use a terminal. The generic model does NOT mean a completed independent social, commercial, financial, creator or gameplay service. No generated geometry is a verified physical property. These foundations are reusable entry presentations, not additional rooms in World. The dedicated Space repository/building database and actual Godot World source/export were not altered; the World information/launch route receives a 3D entrance while its original controls remain accessible.

The logo menu remains Store and Blog. Original workspace navigation is retained with the tools, rather than mixed into that logo menu. The renderer provides keyboard rotation/zoom, touch/mouse input, reduced motion and a fallback message. Actual visual behavior is not browser-verified.

## Independent packaging

Added scripts/build-virtual-apps.py. It prepares 12 separate app roots (the 11 registered domain apps plus Blog), each with its own entry, assets, intended CNAME and development-status metadata. Existing dedicated experiences are reused; legacy tools receive their own static shared libraries instead of redirecting to one central site. Cross-application links point at intended independent domains, whose availability is not verified here. No backend or runtime database is included. World retains its separate existing export/deployment workstream, not a replacement static copy.

The old build-app-entrypoints.py is retained as a clearly labeled legacy compatibility alias generator. Use the new virtual package builder for independent apps. Intended CNAME files are configuration, not evidence of domain ownership or actual deployment.

```sh
python3 scripts/build-virtual-apps.py --out /new/empty/independent-apps
```

Output must be new. Existing output is never overwritten. Generic Space packaging contains the preserved legacy tool and a generic 3D entrance; it does not include the dedicated Space building service or six-million-footprint database. Deploy the actual maintained Space build for those capabilities.

## Checks

Two new tests validate all registered /apps and /home spatial routes (including existing immediate aliases to actual experiences), all 12 independent roots, direct HTML asset links, absence of central meta redirects at package roots, and exclusion of service/database files. Existing commerce package checks, app-entry checks, generated-home validation, Page keyboard controls, Plus controls and Exchange wallet tests passed. HTML attributes were checked for accidental duplicate class/data attributes. JavaScript syntax and diff checks passed.

All 38 tests in the full commerce/identity regression suite passed. Rendering, overlays, orientation, touch behavior, accessibility and actual external domains still need browser/device review. File checks do not prove visual success or live services.

## Limits and next step

All changes are source/prepared-package changes. Current live founder sites may still show old layouts; this build does not claim otherwise. The private review deployment is unchanged. No identity backend, financial activation, real products, verified lease listings or Quest gameplay was added. Quest receives only a consistent entry foundation, not a new game design.

Next: visually verify these entrances, then update the private review copy for founder review before any approved production release. Preserve independent deployment and functional differences as each platform's dedicated environment replaces its generic entry foundation.
