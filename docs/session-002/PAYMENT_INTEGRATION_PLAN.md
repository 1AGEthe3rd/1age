# 1AGE Virtual Checkout — Build 001 integration plan

Status: unpublished, nonfinancial prototype. November 19, 2026.

## What runs

The browser terminal and Python/SQLite mock service are separate components. Existing websites can remain independently hosted. This build deliberately has no provider credentials, card inputs, wallet signing, external payment request or production mode.

- `experiences/checkout/`: accessible review UI around a reusable 3D terminal.
- `services/checkout/core.py`: server catalog, orders, mock session adapter, signed event verification, state transitions, persistent events, fulfillment references, memberships and credit/debit ledger.
- `services/checkout/server.py`: local-only HTTP adapter; loopback binding, host/origin restrictions, bounded request bodies and order capability checks. It is a development server, not a production server.
- With the local API available, the UI uses server orders and signed mock events. With static hosting only, the label explicitly changes to **browser-only simulation**. Browser-only state is retained in tab-scoped sessionStorage and is never an authoritative balance or payment result.

Run from the repository root:

```bash
python3 services/checkout/server.py
```

Open `http://127.0.0.1:4180/experiences/`. The local database and a randomly generated mock signing key live under `~/.local/state/1age/`, outside the web root. The key is created with mode 0600 and is not sent to the browser. Use a different `--db` path for isolated testing. Preserve the database/key pair together for restart testing. These are demo records, not financial books.

## Current contract

| Operation | Input | Result |
| --- | --- | --- |
| GET `/api/catalog` | None | Mock-only offers and fixed prices |
| POST `/api/orders` | `app`, `sku`, `request_key`, `consent_version`; `X-Demo-Account` | Pending order, immutable server amount, mock session and opaque access token |
| GET `/api/orders/{id}` | `Authorization: Bearer <access_token>` | Current status, demo receipt and scoped demo account balance |
| GET `/api/orders/{id}/receipt` | Same order token; receipt must be issued | Current demonstration receipt, including refunded status |
| POST `/api/simulate` | `order_id`, `state`, same token | Signed mock event processed through the webhook path |
| POST `/api/webhooks/mock` | Raw JSON; `X-Mock-Signature` | Verified event processing with idempotency |

`X-Demo-Account` is an arbitrary local demo account, not authenticated Page identity. It must not be adopted as production authentication. Demonstration order capabilities are retained in tab-scoped sessionStorage for refresh recovery, never in URLs. This is local demonstration recovery, not production session security. Return paths are selected from an application registry, never supplied by the client. A repeated account/request key returns the same order; changing its offer is rejected.

The adapter boundary currently provides mock session creation and event verification. A real adapter must normalize verified provider events into `{event_id, order_id, session, amount, currency, state}`. Replace the demo adapter behind this boundary; do not add card handling to the viewer. The browser success URL alone must never mark an order paid.

## State and accounting behavior

Pending can become paid, failed or cancelled. Failed/cancelled orders cannot later grant fulfillment in this prototype. Paid can become refunded; stale failure/pending events cannot undo success. Both event IDs and fulfillment/ledger references are unique. SQLite transactions cover state, event recording, grants and fulfillment together; concurrent duplicate events produce one grant.

Cash amounts use integer hundredths of one internal credit. A verified eligible **mock** $1 order grants 100 demo units, once. Debits reject overdrafts and are idempotent by reference. Refunds reverse an unspent grant atomically; spent credits cause a review error rather than silently creating a negative balance. A real refund workflow needs a defined policy and exception queue. The current ledger does not create ownership, redemption rights, transferability or on-chain tokens.

The Plus mock requires consent version `plus-demo-v1`. Activation follows the verified mock paid event. Cancellation and refund update the demo membership record. Real recurring invoices, renewal dates, proration, payment failures after renewal, expiry, dunning and customer portal access are **not implemented**.

Fulfillment records are transactional internal references. Delivering authenticated platform events, retries, acknowledgments and reconciliation with an external provider are **planned**, not connected. No real products are shipped or granted.

## Application integration map

| Application | Build 001 behavior | Before live use |
| --- | --- | --- |
| Store | $0 nonfinancial checkout exercise; no inventory | Real SKUs/prices, authorized products, taxes/shipping, fulfillment and refund policies |
| Plus | Proposed $1 USD/month simulation, consent and demo cancellation | Approved price/payment method, merchant onboarding, identity, recurring event handling and portal |
| Cash | $1 accounting-reference simulation and internal ledger | Written provider eligibility confirmation, applicable regulatory/consumer/accounting review, refund policy |
| World / Games / Quest / Page / Space | Documented future consumers; not enabled | Registered offers, permitted use, authenticated scoped integration and fulfillment contracts |

The earlier crypto-vs-card pricing discussion is not settled by this mock. $1 USD is the current handoff's demonstration subscription price, not an announced live card price. No Plus benefits have been fabricated.

## Provider evaluation and proposed next integration

Stripe hosted Checkout is a candidate because its documented flows cover one-time checkout, subscriptions, hosted payment entry and server-side fulfillment. PayPal is an alternative with subscriptions and verified event notifications. Neither provider is selected as an approved merchant account; no fee claims or eligibility assumptions are made.

Primary references reviewed:

- https://docs.stripe.com/payments/existing-customers?platform=web&ui=stripe-hosted — checkout event-based fulfillment.
- https://docs.stripe.com/payments/checkout/pricing-table — subscriptions and customer portal direction.
- https://developer.paypal.com/docs/subscriptions/reference/webhooks/ — subscription event lifecycle.
- https://developer.paypal.com/api/rest/webhooks/ — verification and retries.

## Exact setup and production work still required

1. Founder confirms the legal merchant identity/jurisdiction, provider choice and approved products/use cases. Provider onboarding and test-account access must be completed by the founder.
2. Configure sandbox credentials only in a backend secret store, approved sandbox product/price IDs, a sandbox webhook secret and an HTTPS staging service. Never paste keys into client files or chat.
3. Replace local demo identity with authenticated user sessions and app-scoped authorization. A browser origin allowlist alone is not authentication. Use server-to-server app credentials or short-lived scoped capabilities; no provider secret belongs in an application client.
4. Add a sandbox adapter, verify raw signed provider payloads, retrieve provider status as required, bind amount/currency/session/customer/application to each order and exercise real sandbox redirects/webhooks. Keep simulation endpoints disabled outside local development.
5. Implement consent audit storage, real subscription lifecycle/portal, tax/shipping eligibility, refund orchestration, event delivery/retry, provider reconciliation, rate limits, logging/redaction and monitoring. Review races, fraud, privacy and backups before production.
6. Authorize staging and live deployments separately. Independent app static hosting does not need to move to the backend host. A shared checkout origin and API address still require a founder decision; no new domain is presumed owned.

No production payment switch exists in this build. The next provider milestone is a fully verified **sandbox** end-to-end order, not a live charge.

## Sandbox implementation boundary prepared November 20

Before adding a real test adapter, separate the service's order-capability signing key from `MockAdapter.secret`. The current prototype uses that mock secret for stable retry tokens. A provider credential must never become a browser capability key.

The first provider adapter should be sandbox-only, reject live configuration, and accept only registered application offers. Keep provider session creation outside long database transactions; persist a retryable creation state and send the same provider idempotency key when recovering. Bind its provider session to one immutable server order and verify amount, currency, environment and application before fulfillment.

Provider event normalization needs an explicit mapping for asynchronous settlement, refunds and subscription invoices; do not blindly translate every event into the mock's terminal-state rules. Preserve raw signature verification and unique provider event IDs, and record durable fulfillment work before sending application notifications. A signed event and a browser return can race; neither may duplicate fulfillment.

Sandbox acceptance scenarios: lost session-create response, duplicated/out-of-order events, delayed payment, wrong amount/currency/application, cancelled return followed by verified settlement, refunded payment, renewed/failed/expired subscription and unknown provider status. Read the chosen provider's current official API documentation before implementing these mappings. These are integration requirements, not features already implemented.

Missing founder setup remains: provider selection and sandbox onboarding, approved sandbox offers, backend secret configuration and staging identity/hosting. No provider-specific account access is required to review the current local demonstrations.
