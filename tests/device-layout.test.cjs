const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../device-layout.js'), 'utf8');
function device(points, coarsePointer, landscape) {
 const listeners = {}, media = {}, root = {dataset: {}};
 const window = {
  addEventListener(name, fn) {(listeners[name] ||= []).push(fn);},
  dispatchEvent(event) {for (const fn of listeners[event.type] || []) fn(event);}
 };
 function matchMedia(query) {
  return media[query] ||= {matches: query.includes('coarse') ? coarsePointer : landscape,
   addEventListener(name, fn) {this.change = fn;}};
 }
 vm.runInNewContext(source, {document:{documentElement:root,addEventListener(){}}, navigator:{maxTouchPoints:points}, window, matchMedia, Event:class {constructor(type){this.type=type;}}});
 return {root, window, media, rotate(value) {const q=media['(orientation: landscape)'];q.matches=value;q.change();}};
}
const hybrid=device(10,false,true);
assert.equal(hybrid.root.dataset.touchLayout,'landscape','Touchscreen with a fine primary pointer uses touch landscape');
hybrid.rotate(false);
assert.equal(hybrid.root.dataset.touchLayout,'portrait','Upright tablet uses portrait');
hybrid.window.dispatchEvent({type:'pointerdown',pointerType:'mouse'});
assert.equal(hybrid.root.dataset.touchLayout,'portrait','Mouse input does not remove touch capability');
hybrid.rotate(true);
assert.equal(hybrid.root.dataset.touchLayout,'landscape');
const desktop=device(0,false,true);
assert.equal(desktop.root.dataset.touchLayout,'desktop');
desktop.window.dispatchEvent({type:'pointerdown',pointerType:'touch'});
assert.equal(desktop.root.dataset.touchLayout,'landscape','An observed touch corrects missing capability reports');
desktop.rotate(false);
assert.equal(desktop.root.dataset.touchLayout,'portrait');
assert.equal(device(0,true,true).root.dataset.touchLayout,'landscape');
hybrid.media['(orientation: landscape)'].matches=false;
hybrid.window.dispatchEvent({type:'pageshow',persisted:true});
assert.equal(hybrid.root.dataset.touchLayout,'portrait','Back restores recheck orientation even without a resize event');
console.log('Device layout checks passed: hybrid input, orientation changes, desktop and observed-touch fallback.');
