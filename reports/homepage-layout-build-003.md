# Homepage layout repair 003

Date: November 21, 2026. Branch fix/homepage-orbit-layout-003, based on Blog checkpoint 6fdf158. GitHub main refreshed and remains da55741; the new source changes are unpublished.

## Confirmed cause and targeted repair

The sizing function enforced a 160-pixel minimum globe while permitting a much smaller circular dial. In a 390 × 400 short portrait viewport, the browser rendered a 160-pixel globe, 112-pixel orbit and 44-pixel planets: negative edge clearance of 46 pixels. This reproduces one concrete cause of the reported overlap; it is not proof of every device/browser-cache failure.

Added a geometric clearance cap for flat layouts, preserving normal dimensions where they already fit. Short portrait viewports now reserve space for the circular composition and allow vertical scrolling instead of compressing the dial through the globe. Touch-landscape sizing, front/back depth layers and spherical planet styling remain intentional and unchanged.

Orbit layout now ignores zero-size hidden measurements and remeasures after pageshow, visibility restoration and the existing home-restored event, with bounded animation-frame settling and navigation cleanup. Globe rendering, six planets, links, label Enter, menu, ticker, Search and application content were not redesigned or replaced.

## Browser measurements

A same-origin iframe fixture used the actual homepage assets at specified viewport dimensions. Touch mode was selected explicitly in the fixture; this is CSS/layout verification, not physical device emulation. Desktop fixture ran the actual device detection script.

| Case | Scene | Orbit | Globe | Planet | Edge clearance |
|---|---|---|---|---|---|
| Short portrait before, 390 × 400 | 375 × 214 | 112 × 112 | 160 | 44 | -46 |
| Short portrait after | 375 × 359 | 257 × 257 | 185 | 44 | 14 |
| Normal phone portrait, 390 × 740 | 375 × 546 | 305 × 305 | 188 | 53 | 32 |
| Desktop, 1366 × 768 | 1100 × 505 | 378 × 378 | 270 | 61 | 23.5 |
| Touch landscape, 1200 × 600 | 1185 × 592 | 721 × 228 | 343 | depth-scaled | intentional 3D crossings |

Normal phone portrait dimensions were identical before and after repair and after opening/submitting/closing Search. Landscape produced both layer 2 (behind) and layer 7 (front) planets as required. Browser scrollbars account for the difference between iframe viewport and scene width. Extremely short portrait displays intentionally scroll; no claim is made that every height can display the full composition on one screen.

## Tests and limitations

Passed: homepage restore/keyboard-compression safeguards, new transient flat-clearance assertion, new zero-size orbit preservation and landscape-depth checks, device-layout tests, horizontal touch drag/vertical-scroll/pinch cancellation, ticker scrubbing and sharded Search tests. Added a dedicated read-only GitHub Actions layout workflow. Syntax and whitespace checks passed.

Actual iPhone Safari browser chrome, Chuwi/NanoTE touch hardware and native Back/Forward cache behavior still require verification. The browser fixture exercises viewport changes and Search return but does not emulate all OS input or browser-cache behavior. No public deployment or production DNS changed.

## Handoff remaining

Cloudflare private logs and configuration require secure account sign-in; no Cloudflare connector was found. Godot export/preview hosting still needs verification. Real payment-provider setup, shared production identity/entitlements and World touch/hologram routing remain outstanding. Space data was not modified. Search/Cash/Plus/Store/Blog development commits remain included on this branch.
