# Ecosystem Build 022 — Independent 3D Exchange and read-only wallet view

November 22, 2026. Branch feature/exchange-readonly-entry-022, based on Games Build 021. Not deployed.

## Implemented

Added experiences/exchange as an independently packageable 3D-first destination. It reuses the shared official styling/renderer with the original terminal model, manual/keyboard/touch inspection, reduced-motion behavior and 2D fallback. A wallet panel and service-availability panel open above the scene. The logo menu remains Store/Blog only, with a separate Home link. Guest scene exploration requires no Page account or wallet.

Explicit connect buttons use an injected EVM provider or window.phantom.solana. The EVM adapter requests eth_requestAccounts and eth_chainId only. The Phantom Solana adapter requests connect() and reads the returned public key, without assuming the cluster. Account/chain/disconnect events clear the view and remove listeners; events or clearing during an outstanding request invalidate its response. No connection requests run on initial load.

Wallet data stays in memory, separate from Page profiles and the shared account backend. It is not put in URLs, browser storage, telemetry or an application server. This build does not request a signature, send transaction, change chain, load balance or transaction history, or prove account ownership. Clearing the local view does not revoke connected-site wallet permissions; the UI explains how to manage those in the wallet. It does not silently disconnect or claim revocation.

1AGE Swap, payments, requests, banking connections, loans and peer-to-peer trading are marked unavailable. No quotes, prices, financial recommendations, token sales, simulated balances or transfers are shown. Cash is identified separately from the proposed $1AGE token. Exchange is not represented as a bank. Existing apps/exchange manual-rate sandbox remains preserved, with a link to the new 3D entry.

## Verification

Provider-fixture Node checks pass for no eager request, explicit allowed RPC methods, valid account view, missing/rejected providers, Solana unknown cluster, account/chain changes, listener removal and invalidating stale/pending connections. An extra test changes the chain during an in-flight connection and confirms the stale view is discarded.

JavaScript syntax, independent static package link checks, existing Page control tests and Games catalog checks passed. No real wallet was connected, no permission prompt was approved, and no real account data was accessed during development. Extension interoperability, mobile wallet/deeplink support, WebGL rendering and visual layout remain unverified. This is not a complete wallet SDK or live financial service.

## Local review and packaging

Serve static source and open /experiences/exchange/. Clicking Connect may prompt an installed wallet to share its public account; a user must make that choice in their wallet. No private keys or recovery phrases are requested. Browser environments without an injected provider report unavailability rather than fake a connection.

scripts/build-commerce-apps.py now includes an independent exchange directory, official shared assets and intended CNAME. This is prepared configuration, not verified 1age.exchange DNS or ownership. No app has been merged into Page or World. The private review deployment remains on Build 018 and has not been updated here.

## Sources consulted

- https://eips.ethereum.org/EIPS/eip-1193 — request/event API and account/chain changes.
- https://docs.phantom.com/solana/establishing-a-connection — explicit public-key connection request.

The provider code uses a narrow subset. It does not claim a production security certification or standards-complete wallet integration.

## Remaining

Visual review and real extension/mobile tests; approved wallet discovery/adapter support; Page identity integration without exposing financial data; verified read-only balances; reviewed swap/transaction design and approval UX; production hosting/domain validation. All live financial activity remains disabled. No DNS, production deployment, live payment or paid service changed.
