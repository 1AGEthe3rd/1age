# Universal interface

The root homepage is the shared shell. A supported `app` query parameter selects
configuration in `app-home.js`, while the root without that parameter remains
1AGE.com. The orbit and controller handlers consume the same markup in every
configuration. Existing `/apps/<app>/` routes remain dedicated workspaces, with
a Home link back to the app shell and an inline search control. The Enter
destination is the existing workspace where no virtual destination is ready.
The root keeps its existing World launch route.

The first app configurations cover Games, Page, Exchange, Space, Design, Quest,
and Cash. Work has a search scope ready for future indexed records and has no
homepage or Enter link until a real destination is available. For separate
domains, reuse this shell and select the application in configuration when those
sites are ready for integration.

## Search and authenticity

`search-index.js` loads the existing 1AGE and Solana indexes for both search
screens. It applies an app scope before organic relevance scoring. Existing
records and trust/risk metadata are preserved. The initial index contains 11
1AGE records and five Solana records, so specialized searches may be empty.

For an editorial review, check the entity's existence, official identity and
ownership, credible activity, and documented risk signals. Record the source
links and review date in a pull request. Add an `authenticity` object only when
the evidence supports the chosen status. For example, the fields are:

- `status`: `identity_verified`, `independently_reviewed`, `flagged`, or `inactive`.
- `reviewed_on`: ISO date of the documented review.
- `evidence`: array of HTTPS source links.

Use an unverified listing when evidence is insufficient. Review dates and sources
are editorial records, not automated proof or a guarantee of financial or contract
safety. Recheck stale entries and entries with new credible reports. Update the
evidence and review date in the same change. Preserve historical risk context.

For a future reviewed ticker feed, source entries from the editorial review
process and publish only relevant claims supported by evidence. Keep sponsorship
in a separate, visibly labeled feed. Never pass sponsored placement into the
organic relevance scorer or use it as evidence of authenticity. No sponsored
placements are enabled in these builds.

To add an approved blockchain, register its own source and mode in the loader and
UI after establishing a chain-specific editorial process. Keep app scopes based
on entity types, independent of blockchain selection.
