# 1AGE Cash — authenticated local test foundation

This extends the existing checkout SQLite ledger. It is not a separate currency database or a live identity/payment service.

Run locally:

```bash
python3 services/checkout/server.py --cash-accounts
```

Open `http://127.0.0.1:4180/experiences/cash/`. Use disposable test credentials only. Registration and login are disabled unless the server starts with `--cash-accounts`; the server binds loopback only. Static hosting can render the 3D environment, but cannot authenticate or issue credits. The UI reports backend unavailability rather than creating a fictitious balance.

## Data and access

- Recoverable SQLite backup is created before the first account migration. No existing rows are deleted or reassigned. Old anonymous demo balances are not claimed by a new handle.
- Test handles are normalized; passwords use random per-account salts and scrypt. Opaque random session tokens expire after one hour and are stored hashed server-side; the frontend keeps tokens in memory only. Reload requires signing in again. No passwords, tokens or account DBs are committed.
- Account ID comes from the validated session, never client account headers. History returns only that account's rows. Creating or simulating account checkout requires ownership checks; final prices remain in the server catalog.
- The previous anonymous demonstration checkout remains separate. Its order capability tokens still work for its test workflow; it is not production authentication.
- SQLite write transactions serialize spending/issuance; the ledger rejects negative balances, update and delete. Backend corrections append reversal entries. Existing checkout webhook signature and idempotency logic is retained.
- Test earning and spend reversals are trusted Python operator calls only. There is no HTTP grant, debit, balance-edit or administrative reconciliation endpoint. No purchasable goods or paid activities have been invented.
- New ledger rows receive timestamps through a trigger. Legacy timestamps are estimates and labeled accordingly. The history uses bounded pagination; offset pagination can shift if new events arrive between pages.
- `Accounts.reconcile` provides operator totals, paid credit orders missing a grant, pending refund recovery counts/amounts, and refunded orders missing either a reversal or pending review. This is not complete provider/bank/accounting reconciliation. Signed mock refund events are recorded even when credits were spent. An explicit trusted test-operator call can retry full credit recovery atomically; no automatic deduction from later earnings or HTTP recovery route exists. See `REFUND-TEST-BUILD.md`.

## Verification

`python3 -m unittest discover -s tests/commerce -v`

Coverage includes existing checkout state/signature/duplicate/refund behavior plus login failure, session expiry/revocation, cross-account denial, client price/account spoofing, forbidden balance edits, concurrent overspending, earning/reversal idempotency, append-only history, pagination, pre-migration backup and HTTP throttling.

## Before public or real-money use

Replace local test identity with a reviewed shared authentication integration including recovery, abuse protection and secure HTTPS session handling. Decide cross-domain session/redirect boundaries rather than sharing browser storage. Keep simulation endpoints out of live services. Establish provider approval, production persistence/backups, signed provider webhooks, financial reconciliation, dispute/refund policies, tax handling and explicit founder approval. No live provider is configured; Cash pricing, earning rules and Plus redemption terms are not activated by this build.

References consulted: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html and https://docs.python.org/3/library/hashlib.html#hashlib.scrypt . These references are implementation guidance, not a security certification.
