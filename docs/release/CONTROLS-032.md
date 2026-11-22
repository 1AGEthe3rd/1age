# Shared controls Build 032

Review build; no DNS, production deployment or live payments changed.

Implemented: always-visible L/R controls, pointer ownership, separate releases, radial deadzone, vector clamping, standard browser Gamepad API mapping, stable controller selection, neutral rearming, edge-triggered buttons, focus/disconnect reset. Scene adapters preserve each scene rather than replacing geometry. Homepage retains its input bus and orbit/globe behavior. D-pad navigates controls, A activates focused controls, B dismisses dialogs, Start opens the logo menu. On a Logitech F310 use XInput (X switch); nonstandard mappings are intentionally not guessed.

Mouse/touch/browser checks: Quest joystick drag visibly changes the scene. Both joystick entrances observed for Quest, Plus, Store, Blog, Page, Games, Exchange, Cash, Design, Shop and App. Existing centered logo and minimal entry copy retained. Space uses the same module in its separate repository. Standalone packages built with asset validation.

Tests: pure input fixture passes deadzone/clamping, held-button edges, neutral/reconnect/focus and unsupported mappings. Plus and Store interaction tests pass. Domain-preview packaging tests pass. Physical Logitech hardware and real touchscreen/multitouch have not been tested in this cloud environment.

World: native Godot patch is isolated against feature/world-domes-destinations, not an older replacement of the public export. Headless checks pass for room construction, visible controls, menu pause/resume, controller helper, dual-stick release, and unowned mouse/click passthrough. Public WASM/PCK unchanged. A fresh matching World web export and device QA remain required before publication.
