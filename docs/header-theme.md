# Shared project header

Every current page uses the same centered emblem/name lockup. The name sits
directly beneath the visible mark, using the empty lower part of its circular
canvas to avoid the former gap. The canonical emblem geometry is retained.

For each project's future domain implementation, reuse the header markup and
stylesheet and put that project's name in `.brand-name` (PAGE, SPACE, GAMES,
EXCHANGE, QUEST or DESIGN). Update its accessible home label, home URL and
page metadata for the real domain at that time. This source does not change
hosting or canonical URLs of other project domains.

The browser tab keeps the green signal-1 favicon followed by AGE on 1age.com.
The in-page home identity remains 1AGE.

Homepage scope: the visible page ends at the orbit controls. The separate
project strip, In orbit previews, lower navigation and homepage footer are
deferred for later design. Their reusable interaction code remains available.
Search results appear above the globe after a query. The World choice sheet's
Explore projects action reveals and focuses the existing project orbit.

Enter 1AGEWorld opens a choice sheet on the homepage. Its native route is
`oneage://world/enter`. The installed desktop bridge accepts only that fixed
route and sends a fixed local request to the existing app. The app's ordinary
World launch function retains touch settings, logging and return behavior.
Browser 3D is still in development and is identified as such in the sheet.
