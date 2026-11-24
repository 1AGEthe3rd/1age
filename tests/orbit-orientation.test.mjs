import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../homepage-world.js',import.meta.url),'utf8');
test('orientation recovery clears stale gestures, touches and animation while retaining angle',()=>{
 const code=source.slice(source.indexOf('  function cancel()'),source.indexOf("  orbit.addEventListener('dragstart'"));
 const listeners={};let released=0,cancelled=0;
 const api=new Function('scene','window','document','cancelAnimationFrame',`let gesture={id:7},moved=true,angle=1.25,targetAngle=2,animation=4,suppressOrbitClick=true;const touchPointers=new Set([7,8]);`+code+`return {state:()=>({gesture,moved,angle,targetAngle,animation,suppressOrbitClick,touches:touchPointers.size})};`)({hasPointerCapture:()=>true,releasePointerCapture:()=>released++,addEventListener(){}},{addEventListener:(n,f)=>listeners[n]=f},{addEventListener(){}},()=>cancelled++);
 listeners.orientationchange();assert.deepEqual(api.state(),{gesture:null,moved:false,angle:1.25,targetAngle:1.25,animation:0,suppressOrbitClick:false,touches:0});assert.equal(released,1);assert.equal(cancelled,1);
});
test('fresh portrait hides dial; rotation preserves open dial',()=>{
 const code=source.slice(source.indexOf('  let lastMode=null;'),source.indexOf("  window.addEventListener('1age-orbit-visibility'"));
 const root={dataset:{touchLayout:'portrait'}};
 const actual=new Function('document','requestAnimationFrame','window','scene','resetOrbitInput','layout', 'let open=true;function setOrbitOpen(v){open=v;}'+code+'return {sync:syncOrbitMode,visible:()=>open};')({documentElement:root},()=>{},{},{},()=>{},()=>{});
 actual.sync();assert.equal(actual.visible(),false);root.dataset.touchLayout='landscape';actual.sync();assert.equal(actual.visible(),true);root.dataset.touchLayout='portrait';actual.sync();assert.equal(actual.visible(),true);
});
