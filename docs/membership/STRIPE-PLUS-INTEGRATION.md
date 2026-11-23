# Stripe + 1AGE Plus — sandbox integration handoff

Status: **preparation code only**. No real checkout endpoint, payment, Stripe customer, paid entitlement or webhooks have been deployed.

## Founder-approved product

1AGE Plus is a **$3.33 USD monthly** membership for eligible shared access to participating projects under 1AGEthe3rd, not a separate subscription per app. Free exploration remains available. Credits, store purchases and physical services are not included. Proposed fee-free Cash purchases require separate Stripe eligibility/approval before implementation.

## Where the Stripe connection stops

- The **Stripe connection in ChatGPT is an optional tool connection**. The founder must authorize it. It does **not** automatically configure 1AGE hosting, API secrets, or Stripe checkout.
- The public `1age.plus` site is on GitHub Pages and cannot safely hold Stripe secrets or receive validated provider webhooks on its own.
- `services/checkout/server.py` is loopback-only and mock-only; do not expose it publicly or use its disposable Cash accounts as paid user identities.
- `services/checkout/stripe_plus.py` is an isolated, **test-mode-only** helper; it is intentionally not wired into a public route or existing Cash account ledger. No real charges or entitlements.

## Founder actions through Stripe's own secure dashboard

1. Confirm the Stripe business account is selected and accepts payments; complete any verification tasks.
2. In **Stripe test mode** create a product `1AGE Plus` with **USD 3.33 recurring monthly**, one seat per subscriber; copy its `price_...` identifier. A copied Price ID is not a secret.
3. Select a secure backend host, account database and exact public HTTPS origin for backend actions. Continue to host the 3D experiences independently.
4. Configure these **only in the backend host's secret store**, not chat or GitHub: `STRIPE_SECRET_KEY` (test-only), `STRIPE_WEBHOOK_SECRET` (test endpoint only); configure `STRIPE_PRICE_ID` as non-secret. Use test and live credentials separately; never commit a `sk_...` or `whsec_...` value.
5. Configure Stripe's Customer Portal for cancellation and payment method updates in test mode. A future server must authorize a portal session only for the customer's authenticated account.

## Release order / security requirements

1. Deploy a reviewed **production-grade Page authentication service** and durable account database; honor uniqueness, account recovery, signout, CSRF protection and owner verification. The existing account code is for localhost testing only.
2. Add a server-to-server billing bridge, authenticate the Page account and bind `subject -> Stripe customer` in the protected database. Client-supplied account names/IDs cannot authorize checkout, subscriptions or the billing portal.
3. Use the backend Stripe test helper to confirm `price_...` is **exactly 333 USD cents, recurring monthly, test mode** before creating a hosted Checkout Session.
4. Create Checkout Sessions on the authenticated backend. Never collect card details in 1AGE pages. Never mark membership active because a browser visits `?success`.
5. Register a protected HTTPS webhook on Stripe test mode. Verify `Stripe-Signature` on the **raw** body and reject live events in test mode.
6. Store webhook event IDs for idempotency, bind subscription + customer to the account, and reconcile the current subscription and paid invoice with Stripe's API before granting, renewing, suspending or revoking entitlements. Events can arrive out of order. Account membership access must **fail closed** on unverifiable status. This prototype's `subscription_candidate` explicitly does not grant access.
7. Expose scoped authenticated entitlements to World, Page, Games, Space, Plus and other studios. Preserve free exploration. Test renewal, payment failure, refunds, cancellation at end of term, signup replay, duplicate/out-of-order webhooks, customer mismatch, coupon/price mismatch, refunds and account takeover.
8. Test end-to-end on real mobile browsers and controllers. Only with explicit founder approval, provider eligibility, legal disclosures, and Stripe live configuration should production payments be enabled.

## Tests and acceptance

Run `python3 -m unittest tests.commerce.test_stripe_plus -v` or the repo's standard commerce workflow. Tests use a fake transport and synthetic Stripe signatures; they make **zero external payment requests**.

A full production launch still requires identity, host, approved Stripe Price ID, provider webhooks, entitlement storage and cancellation UI. The current prototype is **not ready to charge**.

References: https://docs.stripe.com/billing/subscriptions/build-subscriptions?payment-ui=checkout ; https://docs.stripe.com/webhooks/signature ; https://docs.stripe.com/customer-management
