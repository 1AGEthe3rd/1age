# 1AGE Plus — studio-wide membership policy (November 23, 2026)

**Founder-approved proposed price:** **$3.33 USD per month**, recurring. This supersedes older $1, $1.99 and proposed $3 pricing directions in planning notes and prototype screens.

## The membership promise

**One 1AGE Plus membership covers eligible membership access across all participating projects operated under 1AGEthe3rd.** Members should not be asked to buy a second 1AGE Plus subscription for Page, World, Games, Space, NorthLeftChef, NNB, IRK SMIFF or another studio project.

- **Public exploration stays free** where it is already free. Plus is optional.
- A single signed-in Page identity and a shared, server-verified Plus entitlement should be recognized across participating studio domains.
- A Plus membership is **access, not prepaid goods**. It does not automatically include 1AGE Cash credits, purchases in Store/Shop, merchandise, external content, physical venue admission, real-world services, premium game items or independently priced transactions.
- Age, location, regulatory, health/safety, and venue eligibility requirements remain applicable; membership cannot bypass them.
- Project-specific Plus perks beyond the shared access entitlement must be documented and activated before advertising them as live.

## 1AGE Cash checkout fee proposal

- Plus members are intended to pay **no additional 1AGE Cash purchase checkout fee** for eligible Cash purchases. 1AGE absorbs allowable payment-processing costs. This is a proposed benefit, **not currently live**.
- Cash purchases themselves are never free simply because of Plus, and Cash remains a closed-loop 1AGE ecosystem credit, **not $1AGE SPL cryptocurrency**.
- Any eventual bundle discounts must be separately funded and explicitly priced. Unlimited fee-free transactions do not guarantee a net profit from each member.
- Free-member fees, if any, require a separate, clearly disclosed final policy; this document does not authorize a $1 cap, surcharge or undisclosed cost.
- Any real Cash sale or fee subsidies require payment-provider eligibility/approval, financial and consumer review, and a production checkout with transparent total pricing.

## Implementation and launch status

**Pricing and UI updates are mock/demo only.** Do not publish a real Stripe Product/Price, process a real charge, promise live membership access, or enable Cash checkout until the founder finishes product and provider setup.

A secure shared backend must (1) authenticate Page identity, (2) bind billing customer to the Page account, (3) verify signed subscription events, (4) expose scoped membership entitlements to participating projects, and (5) handle cancellation, renewal, retries, refunds, billing portal and access expiry. Provider secrets must not be committed to repositories or placed in GitHub Pages assets.

**Source of truth for this proposal:** `$3.33 USD/month` / `333 USD cents`. A local test/mock order is not a real subscription. 
