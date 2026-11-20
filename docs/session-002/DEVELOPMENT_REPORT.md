# Work Session 002 — development report

Updated November 20, 2026 · Unpublished review build

## Result

Store, visual Blog, Plus and Virtual Checkout have working local prototypes. Existing Store and Plus workspace entry points now lead to the updated experiences. No public website, payment account, DNS record or production release was changed.

## Audit and preservation

- Correct source: `1AGEthe3rd/1age`. Public main was verified at `703609b`; the latest unpublished homepage source was `5bbc9c7`.
- Clean source working tree inspected before work. Created isolated worktree `commerce-dev`, branch `feature/session-002-virtual-commerce`, from `5bbc9c7`. The source homepage branch remains intact.
- Homepage menu order remains Store, Blog, Social, Contact, About. Round slider, ticker replay/information page, search, touch layouts and Back-navigation fixes are retained. No homepage redesign. An explicit `?preview=commerce` flag maps Store/Blog menu items to draft paths; default menu destinations remain the owned public domains.
- Existing `1age-store` and `1age-plus` repositories were inspected: both contain older homepage copies titled AGE and have the matching CNAME files. No Blog repository was found in the connected repository inventory. No duplicate repositories were created. Founder subsequently authorized updating older copies; reviewed standalone packages are prepared for those existing repositories, but not pushed.
- Inspected source contains browser-local Store catalog/Plus preferences/Cash ledger, not a shared payment service. No provider configuration or credential files were found in the inspected checkout; no private account access was assumed.
- GitHub Pages static hosting cannot run this Python payment backend. The local API is a separate service; an approved HTTPS backend deployment is still required.

## Public domain observations

Read-only DNS/HTTPS observations are in `domain-observations.json`. All five addresses returned HTTPS responses. This is reachability, not proof of account ownership or authorization.

| Domain | Observed nameservers | Destination readiness |
| --- | --- | --- |
| 1age.com | Porkbun | Existing release; this session unpublished |
| 1age.store | registrar-servers.com (Namecheap) | Existing repo/CNAME; new showroom package prepared |
| 1age.blog | registrar-servers.com (Namecheap) | Reachable; repository/hosting assignment still to verify |
| 1age.plus | registrar-servers.com (Namecheap) | Existing repo/CNAME; updated membership package prepared |
| 1age.cash | Porkbun | Existing public app; no live credit sales enabled |

DNS observations do not imply permission to switch nameservers. Porkbun is not assumed to be authoritative for every domain.

## Implemented and tested

- **Store:** dark architectural showroom, original extruded monogram, branded pedestal, active-green lighting and checkout entrance. Mouse/touch rotation, zoom and angle/reset controls; no product catalog or invented stock.
- **Blog:** four JSON-backed publications: original brand study, exploratory Pocket model, original GLB massing demonstration and an existing concept image. Viewer supports procedural geometry, packaged GLB/glTF loading, camera controls and descriptions. Image and reading panels work. Video presentation path exists but has no approved video fixture and has not been exercised.
- **Plus:** updated optional membership presentation; links into the shared proposed $1/month demo. Free exploration remains independent. No invented benefits or actual subscription.
- **Checkout UI:** order review, recurring-terms checkbox, pending/success/failure/cancellation/refund states, demo receipt and origin return. All simulation language is explicit; no card entry.
- **Backend:** local Python/SQLite catalog, orders, mock sessions, signature verification, replay/duplicate protections, transactional fulfillment references, subscription demonstration and reliable credit/debit prototype. Eleven backend/HTTP tests passed, including concurrent duplicate grants, amount tampering, consent, unauthorized order reads, state regression, refund review, restart and static path protection.
- **Shared viewer:** pinned local Three.js 0.180.0/MIT; no third-party runtime CDN request. Pixel ratio capped at 1–1.5, 30fps maximum, reduced-motion handling, offscreen/hidden pause and a 2D fallback. GLB demonstration is small and original.

## QA and limits

An additional independent-package regression test passed, checking local asset/navigation targets for Store, Blog, Plus and Checkout.

Browser-tested desktop Store rendering and camera control, Store-to-checkout navigation, Plus consent/activation/cancellation, Cash success/refund and Blog GLB/reading view. At 390px phone frames, Store/Blog/Checkout content width matched available width (375px after scrollbar), with no horizontal overflow. A no-3D-bootstrap fixture confirmed a visible 2D monogram and available checkout navigation. The updated legacy Plus entry and homepage preview-menu-to-Store path were verified. Phone gesture feel and lower-powered hardware performance still require physical-device testing. No measured hardware performance guarantee is made.

The initial static review used a browser-only simulation. The November 20 follow-up connected the browser to the local mock backend and verified pending and paid order recovery, receipt download, refund balance reversal, Plus consent and cancellation recovery. A real provider sandbox and hosted checkout have **not** been integrated or tested.

## Files and review locations

- `experiences/store`, `experiences/blog`, `experiences/plus`, `experiences/checkout` — independent UI sources.
- `experiences/shared` — viewer, original assets, style and pinned vendor files/license.
- `services/checkout` — mock backend and ledger foundation.
- `tests/commerce` — behavioral and HTTP regression tests.
- `scripts/build-commerce-apps.py` — standalone static packaging; never deploys.
- `PAYMENT_INTEGRATION_PLAN.md` — contracts, application boundaries, provider setup and production gaps.

Legacy `apps/store/`, `apps/plus/` and `/plus/` entry pages now redirect to the updated draft experiences. Existing browser-local saved data is not deleted. Main homepage document changes are asset version updates only; generated application homes were regenerated.

## Review and next practical action

Run `python3 services/checkout/server.py` and open `http://127.0.0.1:4180/experiences/` to review with the local mock API. Use `python3 scripts/build-commerce-apps.py --out <new-empty-directory>` to prepare independent static bundles. These packages contain only frontend files, never backend secrets or databases.

Founder review: assess Store/Blog/Plus visual direction and confirm Blog repository/hosting assignment. Then select a provider and complete sandbox onboarding. Next engineering milestone: verified sandbox checkout and subscription lifecycle with authenticated identity. Public app updates and any backend deployment still need explicit approval. Rollback for a future static release is the prior reviewed Git commit; no history rewriting is needed. Database migration/backup strategy must be defined before any real ledger exists.

## November 20 follow-up — recovery and receipts

- Tab-scoped recovery retains application, request key, consent and demonstration order. A lost create response can be retried with the same key. Backend recovery re-reads authoritative mock status; saved UI state cannot create a backend payment result.
- Catalog discovery completes before order creation is enabled. Static 404 selects the explicitly labeled browser simulation. Timeouts, unexpected responses and environment mismatches stop checkout rather than silently switching a saved backend order to browser mode.
- A protected receipt endpoint rejects unauthorized requests and orders without issued receipts. Receipt downloads fetch the current backend record; refunded receipts show the refund state.
- Added Refresh order status and Start another demonstration controls. Flow selection updates the URL so refresh restores the correct application.
- Fourteen Python tests passed, plus the JavaScript recovery checks and the existing homepage/search/ticker/device/navigation checks. Browser verification used the connected local backend for Cash and Plus. The same Cash order ID survived refresh before and after success, balance changed once to 1 and returned to 0 on refund. Plus cancellation survived refresh.
- Recovery uses sessionStorage for demonstration capabilities, never provider keys. It is tab-scoped, is lost when the tab/session is cleared, and may be unavailable when browser storage is blocked. This is not production authentication. Browser-only records remain editable demonstrations, never trusted payment records.
- No public update or payment-provider connection was made. Store/Blog/Plus visuals and the homepage were preserved in this follow-up.
