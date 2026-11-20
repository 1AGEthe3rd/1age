const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../world.js'),'utf8');
const start=source.indexOf("  scene.addEventListener('pointerdown'");
const end=source.indexOf("  scene.addEventListener('lostpointercapture'",start);
assert(start>=0&&end>start);
function scene(){
 const handlers={},captures=new Set();
 const context={scene:{addEventListener:(n,f)=>handlers[n]=f,setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)},orbit:{clientWidth:560,getBoundingClientRect:()=>({left:0,top:0,width:560,height:228})},depthMode:{matches:true},suppressOrbitClick:false,touchPointers:new Set(),open:true,gesture:null,moved:false,animation:0,angle:0,targetAngle:0,hasTurned:false,cancelAnimationFrame(){},pointAngle(){return 0;},layout(){},showPreview(){},nearestIndex(){return 0;},window:{location:{assign(){throw Error('Unexpected navigation');}}}};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 function send(type,x,y,id=1,pointerType='touch'){handlers[type]({pointerId:id,pointerType,button:0,clientX:x,clientY:y,target:{closest:()=>null}});}
 return {context,captures,send};
}
const swipe=scene();
swipe.send('pointerdown',800,100);
assert(swipe.context.gesture,'Open landscape scene accepts a touch outside the thin ring');
assert.equal(swipe.captures.size,0,'Do not capture before directional intent is known');
swipe.send('pointermove',796,100);
assert.equal(swipe.context.angle,0,'Ignore small finger jitter');
swipe.send('pointermove',760,101);
assert(swipe.context.angle>0,'Horizontal swipe turns the dial');
assert.equal(swipe.captures.size,1);
swipe.send('pointerup',760,101);
assert.equal(swipe.captures.size,0);
const vertical=scene();vertical.send('pointerdown',800,100);vertical.send('pointermove',801,140);
assert.equal(vertical.context.gesture,null,'Vertical intent returns control to page scrolling');
assert.equal(vertical.context.angle,0);
const pinch=scene();pinch.send('pointerdown',800,100);pinch.send('pointerdown',780,100,2);
assert.equal(pinch.context.gesture,null,'A second touch cancels rotation for pinch gestures');
assert.equal(pinch.context.angle,0);
const mouse=scene();mouse.send('pointerdown',800,100,1,'mouse');
assert.equal(mouse.context.gesture,null,'Mouse retains the ring hit area');
console.log('Touch drag checks passed: broad target, jitter threshold, horizontal drag, vertical scrolling, pinch cancellation and mouse behavior.');
