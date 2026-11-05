# Publish the shared app homepage updates

This package prepares the existing repositories and the installed World runtime. It does not merge pull requests, change DNS, renew domains or publish a Godot web build.

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

- Exchange registration is current at Porkbun through 2027-04-30, confirmed by the owner. The earlier Namecheap response does not establish expiration; check DNS/hosting separately.
- Quest, Cash and World returned HTTP 503 from the development environment. Their domains need separate availability/hosting verification.
- No public hosting repository for `1age.world` was identified. `/home/world/` on 1AGE.com uses the native handler on configured laptops. This does not expose private Godot source or solve browser 3D.
- Google can retain old titles/icons until recrawling; matching metadata does not guarantee an immediate search-result change.

`manifest.json` records every patch base, reviewed tree and SHA-256 checksum. `APP_HOMEPAGES.md`, `app-domain-audit.json` and `validation.json` provide implementation and validation details.

## World 3D and jump-drive setup (updated)

The World work is already saved on GitHub in draft PR #5: `https://github.com/1AGEthe3rd/1age-world/pull/5`. Main has not been merged. The native candidate is pinned at `4fbede9072fe4b4eac2ea1f7855f31269327ea01`.

On the **Chuwi**, from this extracted package, run:

```bash
python3 finish-setup.py --publish-web
```

This fetches that exact World revision into an isolated development worktree, runs Godot/Python validation, registers the current-user Enter handler, then pushes the website review branch. It does not merge or deploy. Your dirty `world-room-001` or `world-orbital-test` source files are not overwritten. If a source checkout is unavailable, it clones the same private canonical repository instead.

Godot must already exist at `~/1AGE/Tools/Godot/Godot_v4.7.2-stable_linux.x86_64`. This command starts no engine/template download. The existing main homepage Enter link can use the updated World handler immediately after successful installation. Application-specific Enter links require the website PR to be merged and deployed.

With a single jump drive mounted, add `--usb` to also prepare its offline copy. Or run later:

```bash
python3 ~/1AGE/World/world-domes-preview/launcher/usb_transfer.py prepare
```

The helper prints the new USB folder. On the NanoTE, open a terminal in that folder and run `python3 install_on_laptop.py install`. No internet or export templates are needed for that offline installation. The engine/project are copied locally, so you can unplug the drive afterwards. No disk is formatted and existing files are preserved.

Supported direct 3D routes: World, Games, Page, Space, Exchange, Quest, Cash and Design. Games opens its existing complex; the five named flagship pavilions remain observation foundations, and Design uses the builder. Plus/App/Store/Shop retain Open app buttons because they do not yet have established 3D scenes. Phone/browser 3D and headset VR remain separate work.

The domain aliases and the rest of the app rollout still follow steps 1–2 above after the canonical web PR deploys. The World branch is a draft for review; no manual aesthetic checkpoint is required to run its automated tests or prepare the native preview.
