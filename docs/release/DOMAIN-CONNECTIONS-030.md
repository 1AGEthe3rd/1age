# Domain connection inventory — Build 030

Read-only public observations checked November 22, 2026. Registration provider is reported by RDAP, not inferred from DNS. Public DNS snapshots are not complete authenticated zone backups and do not establish account ownership. No changes applied.

| Domain | Registrar | DNS / HTTP observation | Next step |
| --- | --- | --- | --- |
| 1age.games | NameCheap, Inc. | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.page | Porkbun LLC | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.exchange | Porkbun LLC | SERVFAIL from Cloudflare and Google resolvers; HTTPS probe failed | Inspect authoritative zone, delegation and DNSSEC through account access before drafting a repair |
| 1age.space | Porkbun LLC | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.design | NameCheap, Inc. | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.quest | Porkbun LLC | SERVFAIL from Cloudflare and Google resolvers; HTTPS probe failed | Inspect authoritative zone, delegation and DNSSEC through account access before drafting a repair |
| 1age.cash | Porkbun LLC | No apex A answer; HTTPS probe failed | Verify existing hosting and complete zone records before proposing a web target |
| 1age.plus | NameCheap, Inc. | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.app | Namecheap Inc. | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.store | NameCheap, Inc. | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.shop | Namecheap, Inc. | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.blog | Namecheap | A: 192.64.119.243; HTTPS probe failed | Confirm Blog repository/project and preview before proposing a domain mapping |
| 1age.world | Porkbun LLC | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |
| 1age.com | Porkbun LLC | A records match GitHub Pages; HTTP 200 | Preserve DNS; review matching app source branch before any release |

Ten domains already point to the documented GitHub Pages A addresses and returned HTTP 200 in this check. Those records do not need a migration merely to publish updated 3D source. Their currently served content is not automatically the new build, and HTTP 200 is not WebGL verification.

Exchange and Quest returned SERVFAIL using both independent recursive resolvers. Their RDAP registration is at Porkbun while their registry delegation lists registrar-servers.com nameservers; that observation does not establish which account contains the authoritative zone or the cause of failure. Cash has no returned apex A record. Blog currently returns 192.64.119.243 and its intended `1age-blog` repository was not publicly accessible (404); private existence was not established.

No known hostname is being assigned to a new backend. Checkout, identity and Cash services remain local-test-only. Cloudflare project access and authenticated registrar zone exports are still required for safe domain changes. Email MX/TXT and verification observations are captured in the JSON snapshot; no records were altered.

Sources:
- https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
- Per-domain RDAP and DNS request URLs and responses are recorded in `reports/domain-connections-030.json`.
- Independent secondary queries are in `reports/domain-secondary-resolver-030.json`.
