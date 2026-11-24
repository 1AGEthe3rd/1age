# 1AGE App Cinematic World-Connection Audit — November 23, 2026

This is a read-only source audit of repository **root entry pages**, not a claim that deeper routes or other existing builds are missing. No runtime or domain in these repositories is changed by this audit.

## Root-entry findings

| App | Root entry observed | Necessary next step |
|---|---|---|
| Cash | Separate PR `1age-cash#2` adds the actual World iframe **plus Cash-native overlay** and removes generic fake 3D | Verify the holographic menu, underlying Godot render and actual account functionality |
| Page | Standalone root entry with Page preview and `/u/1agejames/` profile path; existing application tools are linked | Preserve real Page profile/editor and integrate original cosmic environment without replacing Page functionality |
| Space | Root is a direct `1age.world/?platform=space` iframe | Preserve existing live `/hq1/` Portland 3D environment and registry; make root discover/enter real Space functions rather than only wrapping World |
| Games | Root is a World iframe | Connect to actual Games catalog and existing NNB gym routes without replacing gameplay |
| Quest | Root is a World iframe | Connect to playable Quest levels/available content; no fabricated missions |
| Exchange | Root is a World iframe | Connect verified Exchange functionality, not a made-up wallet/bank |
| Design | Root is a World iframe | Preserve actual design/workshop files and tools |
| Store | Root is a World iframe | Keep authentic 1AGE merchandise/storefront functionality and approved Store identity |
| Blog | Root is a World iframe | Preserve actual first-party 1AGE content and any working 3D blog interactions |
| Plus | Root is a World iframe | Preserve actual membership flows and honest payments state |
| Shop | Root is a World iframe | Preserve existing shopping/category features where present |
| App | Root is a World iframe | Preserve existing application discovery features where present |
| NNB | Independent playable 3D boxing gym source | Preserve the real NE MLK-inspired gym, controls, bag rounds, HQ1 entry/return and meaningful native gameplay |

## Shared art direction

Every entry should feel like an intentional destination in the **same cinematic 1AGE cosmic universe**, using the authentic original 1AGE World environment, rotating globe, orbital style and sky where possible. The official 1AGE logo menu **must be a scene hologram** rather than a fixed top header icon. Make interface actions satisfying and legible with refined movement/feedback, inspired by the *quality* of Nintendo / Wii / Mario interaction design but using entirely original 1AGE artwork, sounds and content.

The World logo that is already **inside the compiled Godot export** cannot be safely removed or replaced from the embedding page. The original editable `world_build0082.tscn` must be recovered and a native integration reviewed before modifying the source logo's position/behavior. Do not hide or mask the old World top logo with a fake overlay; note the limitation truthfully. Likewise, the original World starfield is the approved source, but scientifically accurate real stars require a verifiable catalog migration.

## Recommended implementation rollout

1. Finish Cash PR #2 as the **first safe implementation example**, with visual checks, functional Cash overlay, authentic World backdrop, holographic logo menu, and no enabled real payments.
2. Integrate Page's functional orbital identity renderer into a genuine shared World transition, with its own profile portals.
3. Improve Space root to expose HQ1 and property functionality rather than a World-only placeholder; preserve existing NNB routes and realistic scene.
4. Audit each remaining app's deeper functional code and make a separate additive branch and draft PR for its root integration. Do not copy a generic starter scene across every app.
5. When the **exact** approved Godot source is recovered, implement common native scene elements (hologram menu, real globe, cosmos, navigation portals and shared controls) in the verified World foundation. Maintain cross-app semantic contracts and tests.

## Design & release gate

An app is not considered "complete" merely because `<iframe src="https://1age.world/">` loads. The actual app identity/function must be usable. Capture real desktop and mobile screenshots, test physical controls when possible, verify accessible alternatives and original gamepad, and obtain founder approval before merges.

The only changes in this audit PR are documentation. All domain DNS, payment account configuration, original World release, and all independent app production branches remain untouched.
