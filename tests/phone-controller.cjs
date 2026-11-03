const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Element{constructor(){this.hidden=false;this.style={};this.children=[];this.parts={};}append(e){this.children.push(e)}setAttribute(){}querySelector(s){return this.parts[s]??=new Element()}}
const head=new Element(),body=new Element(),toolbar=new Element(),events={};
let clicked=0,frame;const planet={click(){clicked++}};const orbit=new Element();
const document={head,body,hidden:false,hasFocus:()=>true,createElement:()=>new Element(),querySelector:s=>s==='#tools'?toolbar:s==='.project-orbit'?orbit:s==='.project-planet.is-selected'?planet:null,addEventListener:(e,f)=>events[e]=f};
let sockets=[],calls=[];
class WS{constructor(){sockets.push(this)}send(data){this.sent=JSON.parse(data)}close(){this.onclose?.()}}
const U=class extends URL{};U.createObjectURL=()=> 'blob:test';U.revokeObjectURL=()=>{};
const context={document,window:{dispatchEvent:event=>calls.push(event.type)},CustomEvent:class{constructor(type){this.type=type}},requestAnimationFrame:f=>{frame=f;return 1},cancelAnimationFrame(){},performance:{now:()=>1000},WebSocket:WS,URL:U,addEventListener:(e,f)=>events[e]=f,fetch:async(url,options)=>{calls.push(url);return {ok:true,json:async()=>url.endsWith('.json')?{relay:'https://relay.example'}:{id:'session',token:'secret',pin:'123456',controllerUrl:'https://relay.example/controller'},blob:async()=>({})}}};
vm.runInNewContext(fs.readFileSync(require('path').join(__dirname,'../phone-controller.js'),'utf8'),context);
(async()=>{
 const button=toolbar.children[0],panel=body.children[0];assert(panel.hidden);
 button.onclick();for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.strictEqual(sockets.length,1);const ws=sockets[0];ws.onopen();assert.strictEqual(ws.sent.role,'host');
 ws.onmessage({data:JSON.stringify({type:'state',paired:true,connected:true,state:{move:[0,-1],look:[.5,0],buttons:{}},events:[{id:1,button:'A'}]})});
 assert(panel.hidden);assert.strictEqual(context.window.OneAGEPhone.sample().move[1],-1);frame(1000);assert.strictEqual(clicked,1);assert(calls.includes('1age-world-turn'));frame(1016);assert.strictEqual(clicked,1);assert.strictEqual(ws.sent.ack,1);
 button.onclick();assert(!panel.hidden);assert.strictEqual(sockets.length,1);
 events.blur();assert.strictEqual(context.window.OneAGEPhone.sample().move[1],0);
 ws.onclose();assert(!context.window.OneAGEPhone.connected());
 console.log('PASS: website adapter creates session, authenticates, consumes actual server state, hides pairing, reopens without re-pairing, clears on blur/disconnect');
})().catch(e=>{console.error(e);process.exitCode=1});
