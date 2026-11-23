# Cash foundation checkpoint — November 21, 2026

Branch: feature/cash-accounts-001, based on Search build 70e2715. Search work remains included and unchanged.

Implemented: disposable local test account registration/sign-in, scrypt password hashing, hashed random sessions with one-hour expiry and sign-out revocation; account-bound server checkout creation and ownership-checked payment simulation; balance/history with bounded pagination; trusted backend test earnings, atomic spending via the existing ledger, idempotent compensating spend reversals, append-only/nonnegative ledger protections and basic operator reconciliation. A consistent SQLite backup precedes first schema migration; prior anonymous balances remain separate. No existing source/data deleted.

3D Cash shell reuses the existing official monogram viewer and accessible account form. Static preview correctly states that backend access is required. No browser-local balance is presented as an authenticated account. Header destinations are Store and Blog. Cash domain, shared identity and World hologram entry remain unconfigured.

Verification: 22 Python commerce tests pass (14 preserved tests + 8 new account/API tests). New tests cover expired/revoked sessions, isolation, unauthorized balance changes, request price/account injection, repeated events, concurrent overdraft protection, append-only history, earning/reversal deduplication, backups, pagination and HTTP authentication throttling. Search routing and 3D destination tests continue to pass. Browser confirmed a WebGL Cash scene and turn control; authenticated UI flow is covered at HTTP/service level, not yet through browser. Physical phone/Chuwi/NanoTE verification remains pending.

No live provider, real payment, genuine Cash issuance, recurring billing, production entitlement or customer account system was activated. Session recovery/password reset, production identity/HTTPS architecture, cross-domain integration, provider approval, full reconciliation and security review remain outstanding. The local Python server must not be exposed as a public payment service. Do not remove accurate test notices.

See services/checkout/CASH-TEST-BUILD.md for launch instructions, API boundaries, migration and limitations. Next: connect a browser-accessible sandbox backend, then test account creation, order success/failure/refund and sign-out end to end; authenticate Cloudflare and inspect existing deployment logs; prepare approved Plus spatial presentation against verified entitlements. Production changes require a separate review.
