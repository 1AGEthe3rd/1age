import {subscribeInput} from './experiences/shared/gamepad.mjs';
// Preserve the homepage input bus and orbit/globe behavior.
subscribeInput(input=>window.OneAGEInput?.setGamepad({move:input.move,look:input.look,buttons:{}}));
