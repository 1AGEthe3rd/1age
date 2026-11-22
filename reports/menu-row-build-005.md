# Whole-row logo slider — Build 005

Unpublished branch `feature/menu-whole-row-005`, based on navigation Build 004.

The open menu uses one horizontal scroll container instead of independent left/right tracks. Store, the original 1AGE logo button, and Blog move together. The logo is initially centered; empty space at each end allows the entire row to slide even when the current short menu fits on screen. Closing returns the same logo element to its normal header position. No duplicate logo or new destinations were added.

Mouse drag, native touch scrolling, round controls, arrow-key navigation, and Escape/outside-click close remain supported. Focus on the logo is preserved when it moves between containers. The closed logo keeps the existing responsive placement, including the corner position in touch landscape. Globe, orbit, search, ticker, and app routes were not edited.

Browser verification found one scroll container containing all three controls. Dragging from the logo shifted Store, logo, and Blog together by 92 CSS pixels and kept the menu open. Escape restored the logo to the header and its original horizontal position. JavaScript syntax and the existing homepage restoration, orbit-layout, and touch-drag checks passed. Physical phone/Chuwi gestures remain to be verified; native horizontal scrolling is retained.

No production files or DNS were published.
