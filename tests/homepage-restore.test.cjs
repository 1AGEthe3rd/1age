const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../home-controls.js'), 'utf8');
// Exercise the real sizing and lifecycle handlers, with browser layout measurements supplied.
const sizing = source.slice(source.indexOf(' function fit(){'), source.lastIndexOf(' sync();'));
const events = {}, documentEvents = {}, frames = new Map(), timers = new Map();
let nextId = 1, results = false;
const properties = {};
const style = {setProperty(name, value) {properties[name] = value;}};
const scene = {clientWidth:390, clientHeight:500, style};
const document = {
 visibilityState:'visible',
 body:{classList:{contains(){return results;}}},
 documentElement:{dataset:{touchLayout:'portrait'},style},
 addEventListener(name,fn){documentEvents[name]=fn;}
};
const context = {
 document, scene, wings:{style}, brand:{querySelector(){return {offsetWidth:55};}},
 innerWidth:390,innerHeight:740,
 window:{addEventListener(name,fn){events[name]=fn;},visualViewport:{addEventListener(){}}},
 matchMedia(query){return {matches:query==='(orientation:portrait)'};},
 requestAnimationFrame(fn){const id=nextId++;frames.set(id,fn);return id;},
 cancelAnimationFrame(id){frames.delete(id);},
 setTimeout(fn){const id=nextId++;timers.set(id,fn);return id;},
 clearTimeout(id){timers.delete(id);},
 ResizeObserver:class{observe(){}}
};
vm.runInNewContext(sizing,context);
function flushFrames(){for(let i=0;frames.size && i<10;i++){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn());}assert.equal(frames.size,0,'Recovery is bounded');}
function flushTimers(){const callbacks=[...timers.values()];timers.clear();callbacks.forEach(fn=>fn());flushFrames();}
flushFrames();
const normal = properties['--earth'];
scene.clientHeight=120;
events.resize();flushFrames();
assert.notEqual(properties['--earth'],normal);
scene.clientHeight=500;
events.pageshow({persisted:true});flushFrames();flushTimers();
assert.equal(properties['--earth'],normal,'Back recovers the original size without resize');
// Simulate a cached page restoring before the final viewport geometry is available.
scene.clientHeight=120;events.pageshow({persisted:true});flushFrames();
scene.clientHeight=500;flushTimers();
assert.equal(properties['--earth'],normal,'Settled measurement corrects transient restored dimensions');
results=true;scene.clientHeight=120;events.resize();flushFrames();
assert.equal(properties['--earth'],normal,'Hidden search scene cannot overwrite homepage dimensions');
results=false;document.visibilityState='hidden';events.resize();flushFrames();
assert.equal(properties['--earth'],normal,'Background page does not record transient dimensions');
document.visibilityState='visible';scene.clientHeight=500;documentEvents.visibilitychange();flushFrames();flushTimers();
assert.equal(properties['--earth'],normal);
events.pageshow({persisted:true});events.pagehide();
assert.equal(frames.size,0);assert.equal(timers.size,0,'Navigation cancels pending recovery');
console.log('Homepage restore checks passed: Back cache, settling viewport, hidden results, visibility and cleanup.');
