# Ecosystem Build 016 — Plus frontend and shared test membership

November 22, 2026. Branch feature/plus-test-entitlements-016, based on d36a2b2. Not published or deployed.

## Implemented

The existing 3D Plus scene is preserved. An optional collapsed Local membership integration test panel inside the membership information provides disposable-account registration/sign-in, authenticated status refresh, consented mock Plus order creation, simulated payment/cancellation/refund events and sign-out. It consumes the shared entitlement contract from Build 015. All status text identifies test membership and absence of real billing/benefits. The proposed $1/month price is unchanged; Cash membership remains disabled.

The test client keeps session and order capability tokens in closure memory, sends session authorization only in headers, omits ambient cookies, uses request timeouts, clears rejected sessions and clears local credentials even if logout fails. A failed network logout can leave the backend session valid until its expiry; local cleanup is not represented as successful backend revocation. Password input is cleared immediately on form submission. A sign-in requires a fresh session after a reload or navigation; no cross-domain SSO or persisted session is implied.

Order creation preserves its request key on uncertain network failure, allowing a retry to recover the same backend order rather than inventing a second request. All pricing, consent validation and entitlement changes remain server controlled. No browser redirect or local active flag activates an entitlement.

## Verified

- 30 existing commerce Python tests passed, plus one new real local HTTP integration test using the actual JavaScript Plus client against Checkout/Accounts.
- The integration test covers registration, inactive state, consented order, mock payment activation, cancellation, late paid duplicate remaining inactive, refund and logout.
- Node client checks cover header-only tokens, consent rejection, session rejection cleanup, logout network failure cleanup and retry idempotency.
- Existing Plus accessible-control tests, Store interaction checks, Blog publication checks and JavaScript syntax checks passed.
- No browser rendering/mobile visual review was completed. These tests do not establish visual approval or production readiness.

## Review locally

```sh
python3 services/checkout/server.py --cash-accounts --db /path/to/disposable-test.sqlite3
```

Open http://127.0.0.1:4180/experiences/plus/, activate the plus, then expand the local test panel. Use disposable credentials only. The static package alone has no account backend; the panel reports service unavailability rather than claiming a membership.

## Remaining all-handoff work

Provider-backed sandbox checkout, secure deployed accounts, cross-domain authentication, live recurring billing periods/renewals/customer portal, approved Cash purchase/Plus terms, production domain/hosting verification and visual QA are still unfinished. Cash payments, real card entry, live membership, new exclusive benefits, production DNS and paid services were not enabled. Independent applications remain independent; the existing Store/Blog menu and free exploration remain unchanged.

This advances the ecosystem Checkout/Cash/Plus handoffs. The separate Space branch and saved databases are untouched. See ALL-HANDOFFS-CHECKPOINT-015.md for the other retained workstreams; that checkpoint is not a claim they were retested here.
