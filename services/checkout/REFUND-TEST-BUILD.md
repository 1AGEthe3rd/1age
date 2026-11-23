# Refund reconciliation — local test build

This service uses the mock adapter exclusively. It does not refund money, recover real credits, bill users, or connect a merchant account.

## Problem corrected

Previously, a correctly signed mock refund event failed if the account could not return all 100 test credit minor units. That rolled back the event and left the order marked paid. Payment-state recording and credit recovery must remain separate.

Now the signed, order-matched mock event transitions the order to refunded and reverses its test fulfillment. If the full credit amount is available, the existing compensating ledger entry is appended. If it is unavailable, the nonnegative balance is preserved and a `refund_recovery` record is marked `pending_review`. No partial recovery is performed.

Duplicate events and repeated refund events cannot create another queue record or ledger reversal. An order cannot be paid again after refund. Invalid signatures and mismatched price/session/currency remain rejected.

The order API, authenticated demonstration receipt, and checkout receipt text include recovery status. The client-facing notice distinguishes a recorded refund from pending credit recovery. There is no browser control or HTTP route for operator recovery.

## Explicit operator action

For disposable local test records only, a trusted Python operator can call `Checkout.recover_refund(order_id)`. It verifies a refunded order and matching account, checks the full available balance inside `BEGIN IMMEDIATE`, and appends exactly one reversal before marking recovery complete. Insufficient balance leaves review pending. Concurrent calls serialize and subsequent calls are idempotent.

Later earnings or other grants do not automatically trigger recovery. This test mechanism does not establish a production right to deduct credits; production refund, dispute, and credit treatment require separately approved business terms and provider review.

## Preservation and reconciliation

A consistent SQLite backup with mode 0600 is created before adding the recovery table to an existing checkout database. Existing ledger rows, orders, sessions, and memberships are retained. Reopening the migrated database does not create another migration backup.

`Accounts.reconcile(account_id)` reads a consistent snapshot and reports balance, entry count, missing paid grants, pending recovery count and amount, and refunded credit orders missing both a matching reversal and pending review. Older successfully reversed refunds need no fabricated queue row. This is a local ledger report, not provider or bank reconciliation.

## Validation

Run `python3 -m unittest discover -s tests/commerce -v`.

Tests cover a refund after spending, signed-event replay, no automatic recovery from later grants, eight concurrent recovery attempts, insufficient balance, unknown orders, account isolation, HTTP receipt status, forbidden recovery routes, and preservation of an existing database before migration. Existing signing, pricing, membership cancellation, authentication, balance protection, and package tests also remain applicable.
