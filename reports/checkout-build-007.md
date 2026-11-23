# Checkout and Cash — Build 007

Development branch: `feature/checkout-refund-reconciliation-007`, based on Search People build `fbc7191`. Includes the prior search, spatial application, homepage, and whole-row menu work. Not published.

## Completed and tested

A valid signed mock refund used to roll back when test credits had already been spent, leaving the order incorrectly marked paid. Refund state is now recorded independently from credit recovery.

- Sufficient balance: append the existing test refund reversal and mark recovery complete.
- Insufficient balance: mark the order refunded and create one pending operator-review record; preserve the nonnegative balance.
- Repeated or concurrently retried events: no duplicate recovery record or reversal.
- Explicit trusted local operator recovery: atomic full-balance check and one compensating entry; no automatic deduction from later earnings.
- Account reconciliation: pending recovery counts/amounts and refunded orders missing a reversal or pending review, in one read snapshot.
- Migration: recoverable SQLite backup before adding the recovery table to an existing database.
- Order/receipt API: reports credit recovery separately from refund state; operator recovery remains unavailable through HTTP.

Checkout receipt text and pending-review messaging were updated. Their JavaScript syntax was checked; browser presentation of this new message was not retested. HTTP receipt data was integration-tested.

## Validation

`python3 -m unittest discover -s tests/commerce -v`: **27 tests passed**.

Coverage includes signatures and event matching, price tampering, duplicate fulfillment, pending/failed/cancelled states, subscription consent/cancellation, authentication and isolation, nonnegative and append-only accounting, signed refunds after spending, concurrent recovery, insufficient funds, receipt authorization, forbidden operator HTTP routes, migration backup, and standalone packages.

The concurrency regression test performs eight recovery attempts and verifies exactly one succeeds without being a duplicate. The pending-review test verifies a later grant is not automatically consumed.

## Preserved and limited

Existing payment adapter remains mock-only. No merchant account, live provider, production identity, real charge, real refund, or real membership was configured. This is not a complete payment-provider/bank reconciliation system. Cash recovery policy for a live product remains a founder/provider/legal review dependency.

Existing order and ledger history is preserved. Older refunded orders with matching reversals remain valid without creating fictional recovery records. This build adds no Store inventory, paid features, production DNS, or hosting changes.

Implementation details: `services/checkout/REFUND-TEST-BUILD.md`.

## Next dependencies

1. Select and securely connect an approved payment-provider sandbox before testing actual provider signatures, subscription lifecycle, and reconciliation.
2. Replace local test authentication with reviewed shared production identity before public account use.
3. Confirm production Cash and membership business terms before activating purchases or credit recovery policies.
4. Restore Cloudflare account access and locate the matching latest World source to continue the blocked deployment/navigation work.
