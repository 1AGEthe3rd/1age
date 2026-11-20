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

## Portrait spacing follow-up — unpublished

After release 68b8604 was published successfully on November 19, the founder requested a lower dial/globe and more separation using the studio portrait homepage as reference. On fix/portrait-dial-spacing, portrait ticker reservation is reduced to a 44px strip with no outside margin, giving the scene 36px more vertical room. The dial gains up to 8px additional radius within screen bounds, independently of globe sizing. This applies only to portrait screens up to 700px wide.

Browser comparison: at 320x556, globe top moved from 229.39 to 247.39px, diameter stayed 160px, and orbit diameter increased from 232.19 to 259.19px. At 390x690, globe moved down 18px, stayed 195px diameter, and orbit increased from 303.39 to 319.39px. Both remained one viewport high. Non-touch 1024x600 and 844x390 measurements were unchanged. iPhone Safari hardware validation is pending. Shared app homepages regenerated; syntax, app-entry and generation checks passed. Not published.

## Inline logo slider follow-up — unpublished

Founder requested the round menu buttons return to the logo's horizontal plane while retaining horizontal sliding. Replaced the dropdown panel with transparent sliding wings on each side of the centered logo. Compact touch landscape extends the wings leftward from its corner logo. Circles use the logo's measured diameter; Store, Blog, Social, About and Contact remain. Mouse dragging now scrolls the touched wing, with native horizontal touch scrolling and keyboard navigation retained.

Browser checks at 320px confirmed matching button row, overflow within the left wing and keyboard scrolling to Social (56px scroll). At 1024px the logo and all menu circle top edges aligned at 8px. Native touch hardware validation remains pending. Syntax, application-entry and generated-home checks passed. Includes the pending portrait-spacing change; not published.

## Persistent planet fill and compact laptop layout — unpublished

Fixed the selected-fill CSS precedence: the former unselected-preview selector was more specific and forced selected planets back to black. The final selected rule now wins, retaining the application's accent background and black icon until the next selection. Initial unselected behavior is preserved.

Added a compact landscape layout for viewports at least 700px wide and at most 700px high that do not report a coarse pointer. This covers a laptop browser reporting mouse input at increased zoom, while preserving the existing coarse-pointer landscape layout. Search is top-left, logo centered in a shallow header, ticker is a 44px strip, and the circular scene gets the remaining height. At 1024x600 the globe increased from 179.48px to 250.70px and page height stayed 600px. Browser checks observed Space, Games and Exchange filled in their respective colors, with one selected planet and black icons. Hardware Chuwi zoom/input reporting remains unverified. No publication performed.

## Chuwi touch orientation correction — unpublished

Founder superseded the compact mouse-style Chuwi draft: touchscreen landscape must use the same depth-aware layout as phone landscape, and upright tablet mode must use the phone portrait composition. Added a shared early device-layout classifier using maxTouchPoints, any coarse pointer, and observed touch events as a fallback. Mouse use does not clear detected touch capability. Orientation changes update layout state, ticker location, orbit geometry and console controls together.

Existing touch CSS is now scoped to the shared root layout state, replacing repeated pointer-only media conditions without duplicating the layout. Removed the prior compact non-touch laptop override. Portrait spacing also applies to larger portrait tablet widths. The six planets, filled selection, inline menu and exact Enter label remain.

Browser fixtures simulate maxTouchPoints=10 with a mouse-like primary pointer. At 1024x600 the layout is landscape touch: 560x228 ellipse, 300px globe, search top-left, logo top-right, L/R touch controls, single-screen height 600px. At 600x900 the layout is portrait: centered logo and search, circular 512px orbit with 300px globe, no landscape console, height 900px. Landscape inline menu stays on the logo row. Tests cover hybrid input, rotations both directions, desktop classification and observed-touch fallback. JavaScript syntax, device-layout tests, app-entry checks and generated-home checks passed. Native Chuwi Firefox and tablet rotation still need hardware review. No publication performed.

## NanoTE device scaling — unpublished

The shared touch detector and orientation rules also cover NanoTE without model-name detection. Added native screen-orientation change notification alongside viewport changes. Landscape sizing caps now grow with available width instead of retaining phone-sized 560px/300px caps on large touch displays. Wide touch scenes use full viewport width to keep the globe centered.

Simulated maxTouchPoints browser checks: NanoTE 1200x1920 portrait uses a 1012px circular orbit and 550px globe, fitting its viewport. At 1920x1200 landscape, the ellipse is 1040x420px with a 520px globe centered at x=960. Chuwi 1024x600 remains a 560x228px ellipse with 300px globe. No overflow in the checked sizes. These are viewport simulations, not checks on physical NanoTE hardware; OS scaling and zoom determine actual CSS viewport size. Device-layout, application-entry, JavaScript syntax and generated-home checks passed. Not published.

## Landscape front/back orbit layering — unpublished

Fixed touch-landscape stacking: the orbit's centering transform created a stacking context that trapped all its planets behind the globe, despite their individual front/back z-index values. Replaced transform centering with absolute inset/margin centering. Front planets can now paint above the globe and rear planets behind it. Split the decorative ellipse into rear and front arcs so the lower/front line also passes in front. This is shared by phone, Chuwi and NanoTE touch landscape layouts.

Browser hit testing at overlapping planet centers confirmed rear Page is behind globe-texture/world-globe, while front Exchange is above both. Orbit transform is none, globe layer 4, rear planets layer 2, front arc layer 6 and front planets layer 7. Visual preview confirmed Exchange and front arc overlap Earth correctly. Application-entry and generated-home checks passed. No publication performed.

## Mobile landscape scrolling and dial gestures — unpublished

Restored 72px of document scroll space on touch landscape and made the main scene sticky, allowing a vertical swipe to reach browser toolbar-collapse behavior without moving the globe off its composition. The viewport-sized scene continues to respond to dynamic viewport changes. Toolbar hiding is browser-controlled and has not been verified on an actual iPhone.

Landscape touch rotation now accepts horizontal drags in the open scene outside the globe and controls, rather than requiring a narrow elliptical ring hit. Directional intent is resolved after 6px: horizontal movement captures rotation; vertical movement cancels dial interaction and leaves native pan-y scrolling available. Horizontal sensitivity is based on a quarter of orbit width. Pinch gestures cancel rotation; ordinary taps and mouse ring dragging remain separate. Portrait touch retains angular dragging with a reduced 6px threshold.

Tests exercise the actual pointer handlers for wide touch hit area, jitter, horizontal movement, vertical release, pinch cancellation and unchanged mouse hit area. Browser at 844x390 confirmed 462px document height, scrollTop=72 after page scrolling, with main top=0 and globe top unchanged at 68.25px. Device-layout, app-entry, JavaScript syntax and generated-home checks passed. Touchscreen gesture feel and Safari toolbar collapse need device validation. Not published.

## Spherical touch-landscape planets — unpublished

Added a lightweight spherical visual treatment to the existing app planets in touch landscape: curved radial lighting, a small specular highlight, shaded edges and inset/drop shadows. Icons remain upright and legible; labels stay outside the sphere. Selected planets retain their full accent fill and dark icons with the spherical shading. Existing depth scale, front/back layering and interactions are reused; no new WebGL scene or assets.

Browser phone and Chuwi landscape previews showed the dimensional spheres. Selected Space retained rgb(226,255,220) base fill, black icon and nonempty shading gradients. Portrait selectors are unchanged. Generated homepage and app-entry checks passed. Not published.

## Submit-only full-page search — unpublished

Removed the debounced search-on-input behavior. Typing now edits the query without opening or replacing results. Submitting with Enter/Search opens a viewport-filling results page using the existing index and result renderer. The existing form moves into a sticky results search bar, so subsequent queries remain editable without duplicate forms or IDs. Explicit q links still open their requested results. Empty submissions keep focus in the input.

Results use a solid black, borderless surface with no panel outline, radius or panel shadow; cards have no dividing borders. The homepage scene and controls are hidden while results are open. The 1AGE return button, close control and Escape restore the closed homepage icon and remove q from the URL. The landscape scroll runway is suspended while viewing results.

Browser checks: typing Phantom left results hidden with zero cards; Enter produced one Phantom result in a 390x690 full viewport. Editing to Ethereum did not replace the displayed Phantom results before submission. Returning home restored the closed icon. Landscape submission produced Ethereum results, and direct q=Phantom links opened full-page results in portrait and landscape. Final landscape bounds were 844x390, black background and 0px border. Search catalog/ranking, app-entry, device-layout, gesture and generated-home checks passed. Not published.

## Ticker typography and search logo — unpublished

Ticker copy is white; application-name spans retain the selected application's accent color in both the headline and expanded details. The search-results return-home control now uses the existing 1AGE logo with an accessible button label. Browser checks confirmed white copy, accented 1AGE Space text and a loaded logo image. JavaScript syntax, generated-home and application-entry checks passed. Not published.

## Logo slider repair — unpublished

Scoped legacy touchscreen fan-menu rules away from the horizontal slider. Their per-button transforms were moving slider buttons out of their tracks and clipping them. Round buttons now retain a common top edge with the logo; landscape tracks align directly beside the corner logo. Overflow tracks remain horizontally scrollable and keyboard focusable. Store, Blog, Social, About and Contact remain; Help is absent and the existing updated About content is preserved.

Browser previews at 390x740, 844x390 and 1280x720 verified aligned circles and no legacy transforms. Portrait overflow advanced to scrollLeft 56 and returned to 0 using menu keyboard navigation. Store and Blog URLs, Social submenu and Contact dialog were checked. Device hardware swipe feel remains to be checked. Syntax, app entry and generated-home checks passed. Production remains at 703609b.
