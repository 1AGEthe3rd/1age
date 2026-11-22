# Build 031 — spatial-only public platform entrances

Quest, Design, Shop and App public export roots now contain only the 3D entry module and its assets. Legacy task lists, design forms, marketplace lists and workspace scripts are excluded from those entry documents. Existing workspace source and history are retained. Public scene controls rotate, zoom and reset the 3D environment; they do not open a conventional workspace page. Quest gameplay/rewards and marketplace transactions remain in development.

Quest has an original portal/mission-node environment; Design has a spatial workbench; Shop has an empty exhibition/marketplace framework; App has a spatial discovery-hub framework. These are foundation environments, not claims of completed application services. All use the existing official brand asset, palette and shared renderer. Page, Games, Exchange, Store, Blog, Plus, dedicated Space and World retain their separate established experiences.

The controls-visibility bug found during browser QA was a high-specificity catch-all `display:none!important` rule. Main content is now excluded from that catch-all so necessary Cash/Checkout panels can open; foundation entries do not expose those legacy workspaces at all. Scene controls are separately excluded and keyboard accessible. No financial functionality is enabled.

Desktop browser QA verified rendered Quest and Design scenes, the Shop/App entrances, and the scene controls; Quest's zoom action was exercised. Original source packages for Page/Games/Plus/Store/Exchange/Blog and the dedicated Space scene were exercised in the preceding desktop QA. Mobile hardware and full game/application services remain separate validation work.

Existing domain mappings were read and verified in the prior audit: ten apex domains already use GitHub Pages. Exchange/Quest DNS failures, missing Cash apex mapping, Blog's unmatched hosting target and Cloudflare sign-in failure remain blockers. No DNS or nameserver changes are included in this source fix. Domain publication is handled per repository with a retained recovery revision; this note alone is not a deployment-success claim.

The official 1AGE menu button is centered at 50% of the viewport on the web-native app entrances, independently of Home links. Store/Blog navigation opens below that center. This styling does not rebuild or replace the Godot World export.

Browser DOM measurements confirmed exact menu centering (681.5 px on a 1363 px viewport) on App, Page, Games, Exchange, Plus, Store and Blog previews. This verifies desktop placement; physical touch devices remain to be checked.

Visible arrival headings, slogans, welcome copy and routine instruction lines are removed from the web-native 3D entrances. Browser-tab metadata, accessible action names, publication content, error messages and transaction terms remain. Details open on request.
