# 1AGE web foundation — October 16, 2026

Source baseline: `a1d1ccf97975dabc0083a3767c21c264f9162607` from the existing public `1AGEthe3rd/1age` repository. Keep the existing CNAME and GitHub Pages hosting. This branch is a source proposal; it does not change the live domain until deployed.

## Ready for review

- Existing five-entry directory and scoring behavior retained; visible review dates and a readable non-JavaScript directory.
- Search stays primary. Purple globe, ring, vector logo, touch project orbit, keyboard controls and reduced-motion support follow the approved desktop.
- Eight readable pages: Home, About, Ecosystem, World, Plus, FAQ, Directory, Updates.
- Unique page titles/descriptions, absolute canonical URLs, Open Graph metadata, site/publisher identity JSON-LD, robots policy and a sitemap.
- Important product descriptions are in static HTML. No text-only cloaking or crawler-specific alternate claims.
- Project capabilities clearly identify development status. No invented users, reviews, endorsements, audited status, active memberships or payment success screens.
- No external fonts, tracking pixels, blockchain library or WebGL dependency. A small continuous world texture uses black oceans and green land, with a purple globe outline and a two-minute rotation. The old atlas remains in source for history but is not used by the homepage renderer.

October 17 refinement: centered circular logo/wordmark and Explore/About links;
opaque black ring band with slow balance motion; directional carousel arrows
snap the next planet to the bottom and change the full-width project preview
strip. Dragging still rotates freely. Directory results appear after a search.
Preview cards describe current project directions and link to existing pages.
The latest home puts circular preview visuals directly under the orbit controls,
uses the canonical green number 1 as its circular favicon, and replaces the large
homepage introduction/membership blocks with compact navigation links.

## Before opening Plus payments

1. Verify ownership and the receiving address behind `1age.sol`. Publish no payment address until verified.
2. Define one benefit that is available at launch. Do not sell an unspecified roadmap.
3. Publish the membership period, renewal process, exact crypto/card price, cancellation and refund terms, and a real support contact.
4. Build order/account matching, verify the real USDC mint, recipient, amount and on-chain status on the backend, and prevent duplicate signatures/order fulfillment.
5. Test on devnet, then a small real mainnet transaction with a confirmed wallet and membership record.
6. Keep keys out of the website and repository. The planned `1age.exchange/plus` route needs a backend separately from this GitHub Pages source.

## Search and AI discovery after public deployment

- Verify `1age.com` ownership in Google Search Console and Bing Webmaster Tools using their actual verification tokens. None are invented in this source.
- Submit `https://1age.com/sitemap.xml` and inspect representative live URLs.
- Confirm normal 200 responses, correct canonicals, mobile usability, valid structured data, and readable content with JavaScript off.
- Confirm host/firewall access for search crawlers, including OAI-SearchBot. The provided normal robots policy does not block public pages; training crawler policy is not separately changed.
- Link the same 1AGE identity and website from actual controlled GitHub and social profiles.
- Publish useful, accurate release notes and reviewed directory entries; do not mass-generate near-duplicate keyword pages.
- Measure branded search impressions, indexed pages, referrals and Plus conversions after the real checkout ships.

Eligibility is not a guarantee of ranking, indexing, inclusion in AI answers or control over their wording. `llms.txt`, keyword repetition and special AI schema are not required for Google's AI features.

Primary references:
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.openai.com/api/docs/bots

## Local check

Serve from repository root: `python3 -m http.server 8000 --bind 127.0.0.1`
Open http://localhost:8000 on that same computer. Root-relative routes require an HTTP server, not a double-clicked file.

Test search for `wallet`, `developer`, `community`, empty input and an unknown term; try a shared `/?q=wallet` URL. Check a slow/failed index request. Drag a planet without following it, tap to navigate, use keyboard rotation and focus, and enable reduced motion.

Browser QA was unavailable in the managed implementation environment; no preview server or replacement browser was installed. Python HTML/JSON/link checks and Node syntax/behavior tests cover structure and logic, not actual Chrome/Firefox layout or Chuwi touch feel. Review those locally before publishing.
