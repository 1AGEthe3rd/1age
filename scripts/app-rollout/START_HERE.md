# World + website setup

Use this updated package in place of the earlier app-only download.

1. Extract `1age-world-setup.zip` into Downloads on the **Chuwi**.
2. Run:

```bash
cd ~/Downloads/1age-world-setup
python3 finish-setup.py --publish-web
```

This fetches the tested World revision, runs checks, registers this laptop's native Enter handler, and pushes a website review branch. No engine/template download, merge or production deployment is performed. It uses the existing Godot executable already installed on the Chuwi.

The website command prints the PR link. Review/merge that PR, wait for GitHub Pages success, then follow the app-domain publishing steps in README.md. World itself is saved separately in draft PR #5: https://github.com/1AGEthe3rd/1age-world/pull/5 . You can test the native preview before merging it.

With a single mounted jump drive, you can include the copy in the same setup:

```bash
python3 finish-setup.py --publish-web --usb
```

Or prepare it later:

```bash
python3 ~/1AGE/World/world-domes-preview/launcher/usb_transfer.py prepare
```

On the NanoTE, open a terminal in the newly created USB folder and run:

```bash
python3 install_on_laptop.py install
```

The USB copy contains the project and engine, so no new download is needed on the NanoTE. Installation copies them locally and registers Enter links. Existing files and other USB contents are preserved.

If a command stops, send its output. Do not reset or delete existing project folders to force it through.

Current scope: Games enters its existing 3D complex; Page/Space/Exchange/Quest/Cash enter their corresponding glass pavilions; Design enters the builder; World enters orbital arrival. Plus/App/Store/Shop keep their web workspaces until actual 3D spaces exist. Phone/browser 3D and headset VR are not included in this native setup.
