# Shared Page identity and independent applications — Build 019

Founder directive accepted November 22, 2026. Branch feature/page-shared-identity-019. This is a local development foundation, not deployed production SSO or a complete implementation of the handoff.

## Platform boundaries

| Independent platform | Intended responsibility | Identity connection |
| --- | --- | --- |
| 1age.page | 3D social network and universal Page profile | Profile and identity authority |
| 1age.exchange | 3D financial services | Identity-only audience; wallet/payment connections remain separate |
| 1age.games | Holographic multichain gaming universe | Same subject, optional social features |
| 1age.space | Property and virtual destination discovery | Same subject, explicit destination access rules |

Each remains independently hosted and directly accessible. None becomes a room inside Page or World. Public discovery should remain available without sign-in; identity protects personal/social operations. No app domains, repositories or existing 3D scenes were replaced by this build.

## Implemented

PageIdentity reuses the existing account subject instead of creating another account database. A profile has display name, short bio, an unpopulated avatar reference and explicit discoverability. New profiles are private. Publication requires an explicit update with discoverable=true; private and missing public profiles return the same unavailable response. Unknown profile fields—including wallet data—are rejected. Public output has only subject, handle, display name, bio, avatar and local-test status.

An authenticated issuer session can request a short-lived S256 proof-bound authorization code for an exactly registered client/redirect. Codes are stored hashed, expire after 90 seconds and redeem once under a SQLite immediate transaction. Tokens are hashed, last 15 minutes, identify one client audience and permit identity:read only. Redemption and userinfo require the original issuer session to remain valid; issuer logout also invalidates outstanding codes and child grants.

Crucially, these identity tokens are not Cash session tokens. They cannot authorize Cash balance/history, financial operations or the legacy Plus-entitlement endpoint. A later trusted entitlement integration requires its own approved scoped interface, not broader public-profile access.

Read profile, update profile, public profile, authorize, token and userinfo HTTP routes are available only when --page-identity is explicitly enabled with --cash-accounts. The issuer session is passed as an Authorization header, never an account ID selected by the caller. Client tokens belong in headers, never callback URLs. Authorization responses contain a code/state and registered redirect, never a bearer access token in a URL. There is no automatic browser redirect implementation yet.

## Local testing

```sh
python3 services/checkout/server.py --cash-accounts --page-identity --db /path/to/disposable-identity.sqlite3
```

Explicit development clients: page on http://127.0.0.1:4191/callback; exchange on :4192/callback; games on :4193/callback; space on :4194/callback. These are protocol fixtures, not running app listeners. Live domains are deliberately not registered by assumption. Browser CORS and cross-domain cookie/session transport are not enabled.

| Route | Operation |
| --- | --- |
| GET /api/page/profile | Issuer-session owner view |
| POST /api/page/profile | Strict display_name/bio/discoverable update |
| GET /api/page/public?handle=... | Explicitly discoverable profile only |
| POST /api/page/authorize | Issuer session plus client_id, redirect_uri, code_challenge, state, method=S256 |
| POST /api/page/token | code, client_id, redirect_uri, verifier |
| GET /api/page/userinfo?client_id=... | Audience-bound identity token |

This is a narrow development protocol, not a standards-certified OAuth/OIDC server. No JWT/ID tokens, issuer discovery, refresh token, production login UI or browser callback implementation is provided. Before public deployment use a reviewed identity-provider architecture rather than assuming this prototype supplies every required protocol control.

## Tests and preservation

The existing 31 commerce/client integration tests and five new identity tests passed in the 36-test run. After adding the HTTP handoff test, all five Cash/identity HTTP tests passed, giving 37 distinct tested cases overall. Coverage includes shared subject across clients, audience mismatch, denial of financial API access, exact redirect rejection, incorrect verifier, code replay/expiry, parallel redemption, logout revocation, default profile privacy, explicit publication, rejected wallet fields and actual HTTP profile/code/token/userinfo flow.

The first identity migration creates a restrictive-permission SQLite backup of the existing account/ledger database. Existing source history and Plus/Cash/Checkout behavior are preserved. No real user data was imported. The deployed private static review remains unchanged and has no identity backend.

## Remaining requirements

1. Confirm domain ownership/hosting and choose/deploy the reviewed identity provider and secure browser session architecture; implement client state validation, issuer binding, consent screens, callback URL cleanup and narrowly allowed origins.
2. Connect Page's 3D profile UI to this shared contract and integrate the independently maintained Exchange/Games/Space clients; retain public exploration.
3. Add authorized avatar uploads/model references with validation; no uploaded avatar pipeline exists now.
4. Implement opt-in social presence, friendship permissions and join-destination authorization. No online user positions, location tracking or friend-join network is implemented.
5. Add lifecycle controls, rate limits, code/token cleanup, monitoring, recovery and security review before production accounts. No financial scopes should be bundled into public social identity.

The intended reusable presence contract should disclose application/destination only after opt-in and filter by owner privacy and destination access. A friend relationship never bypasses a private venue's permissions. Third-party destination links do not automatically become authentication clients. These are requirements for the next build, not working social features.

## Standards consulted

- https://www.rfc-editor.org/rfc/rfc7636.html — S256 proof-key transformation and verifier format.
- https://www.rfc-editor.org/rfc/rfc9700.html — exact redirect binding and authorization-code security considerations.

No production domain/DNS changes, public account launch, paid service, wallet connection, live billing or financial data sharing occurred.
