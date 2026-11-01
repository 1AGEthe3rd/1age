# Ecosystem and builder controls

1age.com is the public ecosystem entry. 1age.design is the creator product, using downloaded 1AGE.Desktop tools. Project-specific editing worlds are not complete yet. Native project links currently enter an explicitly labelled builder foundation using the existing tested movement space.

## Browser environment adapter

`console-controls.js` exposes `window.OneAGEInput.subscribe(callback)`, returning an unsubscribe function, plus `snapshot()` and `reset()`. Each immutable snapshot has `{move:{x,y},look:{x,y},buttons:{A,B,X,Y,up,down}}`; axes are -1..1. Alternatively listen for the `1age-input` CustomEvent on window. Movement is forward when move.y is negative. Integrate this bus into a browser virtual environment's physics/camera loop; do not synthesize keyboard events.

The home maps the left stick's horizontal axis to project stepping and the right to globe rotation. Game buttons emit input signals. They do not navigate unexpectedly while held. Native Godot environments continue to use their working native input implementation. Browser-to-native input streaming is not provided.

Pointer IDs own individual sticks/buttons. Pointer up, cancellation, lost capture, page blur, hidden page and orientation change reset input immediately. A 4.5% radial dead zone is rescaled continuously. Long holds are cancelled after 9px movement; 550ms reveals options. Shift+F10 provides keyboard options. Pinch zoom outside console controls remains browser-native.

## Layout

Portrait/tablet L/R open three destinations each. The orbit is hidden while a menu opens. In landscape on a touch display the console appears, with L/R menu controls beside the sticks. The central globe remains large; orbital items passing in front of the globe are concealed until they reach the side lanes. Dragging and stick stepping bring every project into view. There is no model-name detection.

## Favicon

A public 96x96 PNG at /assets/favicon-logo.png contains the canonical logo on a black circle. Search engines independently decide when and whether to display it. Keep this URL stable and crawlable.
