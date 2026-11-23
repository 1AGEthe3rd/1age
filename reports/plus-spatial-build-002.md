# Plus spatial build 002

Date: November 21, 2026. Branch: feature/plus-spatial-002, based on Cash checkpoint 5ca1a72. Search and Cash source changes remain included. No public deployment, DNS or real-money changes.

## Implemented

Replaced the previous Plus landing-page presentation with a full-viewport black 3D scene: existing official monogram SVG as a floating texture plane, an original solid 3D plus, restrained green lighting, orbital halo and stars. This reuses the locally packaged Three.js dependency and official asset, rather than inventing a logo. The menu contains Store and Blog, with a separate return-home link.

Activating the plus shows membership information in a spatially styled holographic panel within the scene. It states $1 USD/month and preserves optional participation/free exploration. Card checkout leads to the existing shared test checkout with app=plus. Cash membership remains disabled. No benefits, real subscription activation or recurring Cash terms are invented. Accurate payment-unavailable information remains visible when purchase options open.

Accessible semantic controls work without WebGL: membership reveal/close, Escape, focus restoration, logo menu and checkout link. Renderer fallback retains the monogram/plus and the same membership controls. Scene input supports pointer tapping and horizontal dragging; vertical touch scrolling is not treated as rotation. Reduced-motion disables idle animation; pixel ratio is capped, rendering pauses when the tab is hidden, and resources are disposed on noncached page departure. Responsive sizing and a scrollable short-landscape information panel are implemented.

## Verified

Browser rendered the monogram and solid plus, activated the information panel, displayed price and unavailable/test statuses, closed the panel and opened Store/Blog menu. The final caption position is projected below the plus to avoid overlapping it. Physical iPhone/Chuwi/NanoTE input, orientation changes and reduced-motion device testing remain pending.

22 existing commerce/account Python tests passed after the main scene implementation. Standalone app package validation passed after final changes. New UI lifecycle test exercises real membership/menu handlers, Escape and focus behavior without WebGL. Syntax checks and existing 3D search data checks passed. No real card flow or backend entitlement was tested/activated.

## Preserved and pending

Shared checkout, mock provider, Cash account backend, ledger and existing Blog/Store data/assets are unchanged. Standalone Plus packaging includes its new CSS/JS and preserves shared asset paths. No new repository or duplicate backend was created. Existing 1age-plus production source has not been replaced by this development branch.

Pending: production authentication, approved membership benefits/terms, payment-provider sandbox access and approval, real provider event integration, secure entitlements and subscription lifecycle, custom-domain/deployment verification, mobile hardware checks. Cash membership duration/renewal policy requires founder decision before enabling that method. Cloudflare account logs remain blocked by authentication; no working Cloudflare preview claimed.

Next independent build: adapt Store to the approved minimal cosmic platform and Blog to the combined gallery/archive/constellation, reusing structured content and shared dependencies. Keep World controls/scene fixes and the homepage overlap investigation on the backlog; neither is claimed fixed here.
