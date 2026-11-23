# Ecosystem Build 020 — Independent 3D Page profile entry

November 22, 2026. Branch feature/page-3d-profile-020, based on identity foundation 990b0cb. Not deployed.

## Implemented

Added experiences/page as an independently packageable 3D-first Page entrance. It reuses the approved official brand geometry/shared renderer, black/green palette, mouse/touch inspection, keyboard rotation/zoom controls, reduced motion and fallback. A profile caption overlays the 3D scene and accessible panels provide Your profile, Discover a profile and destination links. Store/Blog are the only logo-menu entries; independent platforms are separate destination links, not rooms or extra universal-menu options.

Connected the Page client to the existing local identity/account backend: disposable test account registration/sign-in, profile read/edit, explicit discoverability opt-in, publication withdrawal, guest public-handle lookup and sign-out. Tokens stay in memory and authorization headers; passwords are cleared immediately from the form. Public lookup omits session authorization. Rejected sessions clear local access, and unsuccessful identity initialization discards its temporary local session. Profile values render as text, never imported HTML. Wallet data is not collected or included as profile fields.

The old apps/page browser-local editor remains intact with a link to the new 3D build. No existing local-storage profile was imported, uploaded or erased. Added Page to the independent static package builder; its CNAME is intended configuration, not a DNS or ownership verification. Page's domain was not changed.

## Verification

38 commerce/identity Python tests passed, including a new actual JavaScript Page-client-to-local-HTTP-backend integration: default private profile, guest lookup refusal, explicit publication, guest view, wallet-field rejection, return to private and sign-out. The client integration was rerun after initialization cleanup changes and passed. Existing Plus client/backend checks and independent package link checks remain passing.

Page control tests exercise section switching, focus restoration, Escape dismissal and logo-menu behavior without WebGL. JavaScript syntax and diff checks passed. Independent packages were prepared at independent-apps-020. Rendering, touch layout and mobile visual appearance were not browser-verified in this build; code/asset tests are not visual approval.

## Local review

```sh
python3 services/checkout/server.py --cash-accounts --page-identity --db /path/to/disposable-page-test.sqlite3
```

Open http://127.0.0.1:4180/experiences/page/. The scene and guest controls are available without sign-in. Account actions require the explicitly enabled local test backend. Use disposable credentials only.

For an independent static package:

```sh
python3 scripts/build-commerce-apps.py --out /new/empty/package-directory
```

The page subdirectory includes its own index/assets and can be hosted separately. It contains no account backend; service-unavailable messages are intentional when no reviewed identity service exists. No production SSO or cross-domain identity transport has been activated.

## Limits and next requirements

This is a 3D profile entry and local backend integration, not a completed social network. The scene uses the official brand object, not a generated user avatar. Avatar uploads, social connections, messaging, online presence, friend joining and cross-application browser sign-in remain unimplemented. Destination links for Exchange/Games/Space do not prove those domains are live or connected. Exchange and Games 3D implementations remain independent upcoming work; none was merged into Page.

The private review Site from Build 018 is unchanged and does not include this build yet. Secure provider/identity hosting, domain verification, visual QA and a reviewed production authentication architecture are still required. No live payments, public account launch, financial data sharing, DNS changes or existing deployment replacement occurred.
