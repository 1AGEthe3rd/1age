1AGE controller support — 2026-10-19

Website: python3 ~/Downloads/1age-controller-update.zip --publish
Linux desktop, each device: python3 ~/Downloads/1age-controller-update.zip --desktop
Close desktop and World before installation; reopen afterward.
Do website publishing on one computer. All website visitors receive that update.
Desktop updates must be installed separately on each Ubuntu device.

Connect a supported USB/Bluetooth gamepad to the operating system. On the website,
press any controller button, release, then begin. F310: set its rear switch to X.
No antimicrox mapping is required; disable any active keyboard emulation profile
for 1AGE to avoid duplicate input.

WEB HOME: left stick steps planets; right stick turns globe. D-pad focuses visible
controls (including dialogs). A activates focused control, B backs out. LB/RB step
orbit. X opens search, Y expands logo, Start opens destination menu. D-pad then A
can select L/R menus and their destinations. Green outline marks controller focus.
Touch and physical gamepads merge through OneAGEInput. A browser world can use
that bus and set body class virtual-environment to own controller actions.
There is currently no playable browser World: this does not create one.

LINUX DESKTOP HOME: stick/D-pad or LB/RB select globe/projects; right stick turns
World. A highlights the globe, then A enters. A on a selected project opens its
builder foundation. B returns home. X opens L tools, Y opens R tools. D-pad and A
navigate tools. Start switches fullscreen. Back returns home. Dialogs continue
using their existing keyboard/mouse/touch controls.

GODOT WORLD: left stick moves, right stick looks, A jumps, X interacts, Y toggles
flight, L3 sprints, RB rises, LB descends. Start opens/closes the controls panel to pause/resume movement; B opens it. Existing touch and
keyboard controls remain. Close World normally or use Tab to return to desktop.

Uses standard browser mappings and SDL2 desktop mappings; unrecognized browser
mappings are ignored. Current native installer targets the existing Ubuntu
ThinkPad/Chuwi/NanoTE home, not Windows/macOS builds. Phone/tablet controller
support depends on OS/browser pairing support. Do not assume all controllers work.
First connected standard controller is used, with stick dead zones and input
clearing on disconnect/focus loss. Vibration and remapping UI are not included.

Each install prints a backup and a restore command. No hosting settings or
automatic startup files are changed. Publishing uses normal Git push, without
requiring the Pages API that failed earlier. A normal push rejects remote races.
