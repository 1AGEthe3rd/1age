# 1AGE Controller Build 007 — local Gamepad + Keyboard

This is the shared local controller source, with NorthLeftChef as the first web
integration. No hosted deployment or paid hosting is required. Other 1AGE apps
must adopt the receiver adapter before their controls/text fields will work.

Run the supplied 1age_controller_build007.py on ThinkPad or CHUWI. Startup prints
each step, prepares a versioned editable source directory and private Python
virtual environment, and launches the server explicitly. First dependency setup
requires internet and Python venv support. Project repositories, desktop scenes,
existing startup entries and published sites are not modified.

If an older controller still occupies the default port, this build selects a
free nearby port. Always use the NEW computer URL/QR printed by this launch.
The computer and phone must have a reachable Wi-Fi/hotspot connection. Keep the
terminal running. If the browser does not open, paste the complete printed
computer URL into the computer browser. Scan that new page's QR on the phone.

Pairing is short-lived, not permanently paired. It expires after 2 minutes;
claimed sessions last 30 minutes. Use Pair phone to create another session.
The QR card hides after pairing and can be opened/closed manually. Host
credentials survive refreshing the SAME browser tab, but a server restart
requires opening its new computer URL. Local HTTP is not encrypted; use a trusted
local network. No internet-wide pairing service is deployed.

## Modes

- Gamepad: existing dual sticks, ABXY and menu. Keyboard/touch/physical inputs in
  the café are retained. Losing focus or connection releases movement.
- Keyboard: tap Keyboard on the phone, type with the normal phone keyboard and
  press Send text. Motion is released on switching modes. Text goes to an active,
  eligible 1AGE web text field, or a local phone-notes panel in the café. Password,
  disabled and read-only fields are excluded. The notes are an in-memory scratchpad,
  not saved messages, chat, account history or an Apple Messages connection.

Text is limited to 1000 characters / 2000 UTF-8 bytes per send and deduplicated by
message ID. Keyboard mode is currently disabled in the native Godot context until
native text-field integration is added. Native builder/gamepad behavior remains
as previously supplied; this package does not update native project source.

## Reusable text adapter

A web experience may call OneAGEPhone.registerTextTarget(element) to choose a
text field. It may handle the cancelable oneage:text event and preventDefault()
to implement its own text destination. Unhandled text falls back to local notes.
Use this shared adapter when adding Search/Page/World interfaces; do not create
separate pairing or input protocols for each app. 1AGE messaging via Page and
builder-specific contextual controls are follow-on integration milestones.

## Editing on both laptops

The launcher prints the editable source location. Each version's extracted
source is retained; repeat launches preserve edits there. The .venv folder is
ignored by the included .gitignore. Put the source under version control and
commit/push before switching laptops; sync is not configured automatically by
this package. ThinkPad and CHUWI should use the same repository and branches.
Do not edit both copies independently without syncing.

## Current verification boundary

The local protocol/QR/expiry tests are run against this source, along with
JavaScript syntax and host-to-receiver routing checks. Actual ThinkPad/CHUWI
startup, iPhone keyboard appearance, notes delivery, app switching and orientation
must be tested on the user's devices. Earlier reports of missing QR codes mean
neither device should be called currently verified until that acceptance passes.

The original silent startup cause has not been established. This launcher avoids
the previous ZIP __main__ path and makes progress, dependency errors, bind
errors and the current computer link visible; it does not claim that the old
failure was proved to have one particular cause.
