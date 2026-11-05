# Publish the shared app homepage updates

This package updates the existing repositories. It does not merge pull requests, change DNS, renew domains or publish a Godot web build.

## 1. Publish the shared 1AGE.com routes first

Extract the ZIP into Downloads. In a terminal:

```bash
cd ~/Downloads/1age-app-updates
python3 publish-app-updates.py --group core --push
```

The script creates an isolated checkout under `~/Projects/1age-app-rollout/1age`, applies the reviewed patch and pushes `publish/app-home-routes`. Existing development folders remain untouched. It prints the GitHub link for creating the pull request.

Create and merge that pull request into `main`, then wait for the Pages deployment to succeed. Check the Games homepage at `https://1age.com/home/games/`.

## 2. Publish the application domain entrypoints

From the same extracted folder:

```bash
python3 publish-app-updates.py --group apps --push
```

This checks that the canonical app routes are live, then prepares and pushes branches in all eleven app repositories. It prints a PR link for each. Review and merge those PRs when ready. Browser addresses will change from the individual app domain to its matching `1age.com/home/<app>/` route.

Repositories: `1age-games`, `1agepage`, `1age-exchange`, `1age-space`, `1age-design`, `1age-quest`, `1age-cash`, `1age-plus`, `1age-app`, `1age-store`, `1age-shop`.

No extra downloads or packages are needed beyond Python 3 and Git already installed on the Chuwi. Existing GitHub credentials are reused. If Git asks for authentication, use your usual GitHub sign-in; do not paste credentials into ChatGPT.

## Protection and recovery

- `--check` validates package checksums only; omit `--push` to prepare branches locally.
- No commands merge or push main. No force pushes, resets, clean operations or file deletions.
- Origin, repository base, worktree status and final file tree are checked.
- If main has advanced or local changes exist, the script stops rather than overwriting them. Send the output to refresh the package safely.
- Rerunning an already prepared exact branch is supported. Unfinished `git am` sessions are preserved for inspection.
- Commit identity is read from Git/environment or existing `~/Projects/1age` / `~/Projects/1agethe3rd-branding-publish` config. No global Git config is changed.
- All CNAME files, existing workflows and original non-homepage content remain. Legacy page edits only change title/icon metadata.

## What this release does

Twelve shared homepages (including World launch options), app-specific titles/icons/dials, a 1AGE home planet, shared search, the approved globe/ticker layout, workspace search controls, and a 96-record / 16-network catalog. Existing local workspaces are preserved; this is not a new shared account, payment or multiplayer backend.

## Remaining external issues

- Exchange served an expired-domain notice at audit; renewal is an owner action.
- Quest, Cash and World returned HTTP 503 from the development environment. Their domains need separate availability/hosting verification.
- No public hosting repository for `1age.world` was identified. This package adds `/home/world/` on 1AGE.com but does not expose private Godot source or solve the browser export dependency.
- Google can retain old titles/icons until recrawling; matching metadata does not guarantee an immediate search-result change.

`manifest.json` records every patch base, reviewed tree and SHA-256 checksum. `APP_HOMEPAGES.md`, `app-domain-audit.json` and `validation.json` provide implementation and validation details.
