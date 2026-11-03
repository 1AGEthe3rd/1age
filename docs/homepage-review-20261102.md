# Homepage correction review — November 2, 2026

Compared main 413ef9a with development head 512bf50 and inspected https://1age.com in the browser. Development is two commits ahead of main.

## Findings
- November 1 checkpoint 1da36b1 introduced CSS hiding L/R controls, disabled project-preview handling, and disabled preview visibility while leaving preview actions in the menu.
- November 2 commit 512bf50 connected planets to /apps/ pages but left side menus pointing at /ecosystem/ pages. It also forced a circular orbit without replacing the old landscape concealment rule, leaving some destinations hidden on short screens.
- Existing Earth renderer and logo assets remain intact. No November 2 production merge is present in the inspected main history.

## Correction
Restored L/R controls and instruction text. Side menus derive destinations from the existing planets. Restored explicit planet previews and enlargement, including context-menu entry. Kept circular orbit sizing, constrained Earth size to the space inside it, and removed the obsolete landscape planet concealment rule. Added compact landscape header placement. Restored original lettering weight. Retained both search modes, all app pages, original logo assets and Earth renderer, search expansion on the same row, and native World entry protocol.

## Validation
JavaScript syntax checks and git diff --check passed. Browser verified L menu routes, 1AGE search for world, Solana search for phantom, preview enlargement and return to Earth. Desktop screenshot captured. Physical mobile/landscape and installed native-app launch remain unverified. Existing app workspaces were retained, not audited end to end.

No deployment, remote push, merge, or file deletion performed. Corrections are a local review commit based on feature/cosmic-web-foundation.
