# 1AGE application organization and responsive draft

Reviewed November 19, 2026. Source baseline: main 0ffce2a. This is a source inspection, not confirmation of current production services.

## Working order

1. Finish responsive 1age.com and shared application entrances.
2. Verify search, navigation, globe interaction and Enter behavior.
3. Reconcile domains and public World arrivals against the separate World web release.
4. Develop each approved application's useful core, reusing existing code.
5. Publish only after founder approval. Cloudflare setup and the property prototype remain paused.

## Application inventory

All twelve `/home/<app>/` entrances are generated from the canonical homepage. Shared browser workspaces are at `/apps/<app>/`. Domain/repository mappings remain in `data/app-domains.json`; configured mappings are not proof of deployment.

| Application | Existing source implementation | Missing approved functionality |
| --- | --- | --- |
| Search / 1age.com | Search catalog, shared dial, ticker and navigation | Device review; reconcile browser World entry; community identity coverage |
| World | Native launch links in this repo; released browser export in 1age-world-web | Reconcile browser/native entry, runtime destination verification |
| Page | Browser-local profile editor and JSON export | Orbital external profiles, shareable handles, authentication; native messaging later |
| Space | Browser-local space link directory and export | Shared property index, property discovery/detail and authorized 3D links |
| Games | Local two-player tic-tac-toe | Game discovery and in-house game integration; preserve existing Godot work |
| Exchange | Manual-rate conversion sandbox | Existing-wallet connections and financial interactions |
| Quest | Local objective checklist | Discover index, Page identity chapter, story progression and demo reward tracking |
| Cash | Local editable ledger and export | Shared account-based credit ledger; no real credit balances implied |
| Design | Local title/subtitle/color preview and export | Reconcile with existing native creator tools |
| Plus | Local preferences | Membership account and approved payment implementation |
| Shop | Local product link catalog | Shared creator marketplace discovery |
| Store | Local product link catalog | Official studio catalog and purchase flow |
| App | Application link directory | Confirm distribution/discovery scope |

Shop and Store remain distinct. Cash is internal credit; proposed $1AGE is separate. Native destinations and browser-local workspaces do not establish online services.

## Responsive draft

- Touch landscape on compact screens uses the existing depth-aware ellipse, narrowed to leave room for side controls.
- Touch capability uses any-pointer so a touchscreen laptop can qualify even with a trackpad.
- Mouse-only machines retain the 2D layout.
- Portrait globe and dial calculations reuse the studio homepage proportions.
- Removed forced extra landscape scroll height and the legacy 260px scene minimum. Explicit scene width prevents size-container collapse on short screens.
- Shared generated app homes refreshed; original six planets, search and exact Enter label retained.

## Verification

JavaScript syntax, app entry checks, search checks and generated homepage validation passed. Browser layout measurements for the non-touch preview at 390x690, 1024x600 and 844x390 showed scroll dimensions equal to viewport dimensions after the scene-width correction. Desktop search expansion was inspected in browser. Real touchscreen, Safari browser chrome, Chuwi zoom and orientation transitions still require device validation. Do not describe the touch layouts as verified on hardware.

Changes are on fix/responsive-homepage, not published. No DNS, hosting, merges or production changes performed. Rollback before publication: retain main; after an approved publication, revert the responsive commits normally without rewriting history.

## Founder identity clarification — November 19, 2026

1AGE is a blockchain search engine and application ecosystem for all blockchains. Solana is the infrastructure foundation. Multichain scope is not a claim of complete index coverage or completed application integrations. Updated homepage metadata, shared WebSite structured data, About, FAQ, directory framing and README in the unpublished branch. The current source homepage title was already 1AGE; the Google screenshot shows AGE. No claim is made that Google has refreshed its title, snippet or AI Overview. After approved publication, inspect the live source and request recrawling through an authorized Search Console account if available. Google controls generated results and timing.

## Search default — founder revision

Search starts closed on all homepage routes, with a centered icon on the 2D and portrait layouts. Compact touchscreen landscape retains the top-left closed icon. Removed portrait auto-opening, including automatic opening on orientation change. Explicit search URLs with a q parameter still open their requested results. Announcements return to their existing lower-page marker outside compact touch landscape so the closed search icon can remain centered. Click and Escape behavior checked; shared app and search checks pass. Unpublished.

## Dial selection and contextual ticker

Initial homepage load leaves every planet unselected. Turning the dial activates the planet nearest the top; the selection follows rendered rotation and uses its existing accent color. The ticker replaces unrelated announcements with that application's purpose, current tools and development status. Touch landscape reserves a lower-center strip after selection. Expanded ticker lists contain only the selected application's information. Browser checks confirmed initial selected count zero, then Space and Games each matched the top planet and ticker. JavaScript syntax, app-entry, search and generated-home checks passed. Touch hardware validation remains pending; no publication performed.

## Logo menu slider and About

Replaced the logo's spread-out menu with a horizontal, scrollable slider shared by the generated application homepages. Store and Blog link directly to https://1age.store/ and https://1age.blog/. Social, About and Contact remain available. Mouse dragging, native touch scrolling and arrow/Home/End keyboard navigation are supported. Escape and outside press close the menu. Removed Help from both logo menus and removed the gesture-instruction popup.

About now describes the all-blockchain scope, Solana infrastructure foundation, application identities, studio role and current implementation limits. Store and Blog 3D destinations and their World placement remain future design work; no new planets were added. Contact is preserved, but data/header-links.json has no contact email configured, so it currently displays a placeholder rather than a working inquiry destination.

Browser review confirmed the five menu items, correct Store/Blog URLs, keyboard navigation to Contact, absence of the instruction popup, and updated About text. At 390px portrait width the slider stays within the viewport (12–378px) and scrolls horizontally to Contact. Hardware swipe validation remains pending. Syntax, search, application-entry and generated-home checks passed. All changes remain unpublished.
