# Ecosystem Build 015 — Shared test entitlements

November 22, 2026. Branch feature/shared-entitlements-015, based on preserved Checkout Build 007 commit 8edffa7. Not published or deployed.

## Implemented and tested

Added Accounts.entitlements and authenticated GET /api/accounts/entitlements. The subject is derived from the existing local-test bearer session. Clients cannot submit an account ID or claim their own membership. Active test Plus requires an active membership joined to a paid subscription order for the same account and Plus application. Query-only account/active overrides are rejected. Output is explicitly mode=local-test, provider=mock and live_membership=false.

The contract supports independent applications querying one trusted backend without embedding payment secrets or reading another app's private records. It does not require centralizing their hosting. Cross-domain authentication, allowed-origin policy and deployed API access are NOT implemented by this route; never copy session tokens into URLs or assume unrelated domains share sessions.

30 commerce Python tests passed. New tests cover pending versus mock-paid membership, account isolation, cancellation, refund, multiple separate orders, logout/revoked access, client override denial, and late mock-paid duplicate events not reactivating cancellation. Existing Checkout, Cash, HTTP, package and refund/recovery tests remain passing. No payment-provider credentials or live services were used.

## Local review

```sh
python3 services/checkout/server.py --cash-accounts --db /path/to/disposable-test.sqlite3
```

Use an existing authenticated local-test session in the Authorization bearer header when requesting /api/accounts/entitlements. Do not put the bearer token in a query string. Without the explicit local-test account feature, the endpoint is disabled. No external requests or real charges are made.

## Limits

This build adds a shared read contract, not a production account or subscription service. The Plus frontend does not yet consume this route. Existing mock cancellation behavior is immediate; it is not a decision about real paid-through cancellation terms. No billing periods, recurring provider renewals, provider customer portal, real receipts, Cash-based membership purchases, live entitlements or new exclusive benefits were activated. Free exploration is unchanged. Provider-backed sandbox testing, reviewed billing/refund terms and secure deployed accounts remain prerequisites.

Existing Cash ledger, refund recovery, Store/Blog/Plus 3D assets, homepage, menus and Search are preserved. Space's separate source branch remains at c1d7b93 with its stored data unchanged.
