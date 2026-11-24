import {subscribeInput} from './homepage-hardware-gamepad.mjs?v=portrait-fix-002';
// Preserve the homepage input bus and orbit/globe behavior.
subscribeInput(input=>window.OneAGEInput?.setGamepad({move:input.move,look:input.look,buttons:{}}));
