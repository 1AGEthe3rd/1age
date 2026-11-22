// Exercise the actual dialog module without a WebGL context: same controls must work.
import assert from 'node:assert/strict';
class Element {
 constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.listeners={};this.isConnected=true;this.hidden=false;}
 append(...nodes){this.children.push(...nodes);}
 replaceChildren(...nodes){this.children=[...nodes];}
 setAttribute(key,value){this.attrs[key]=value;}
 addEventListener(type,listener){(this.listeners[type]??=[]).push(listener);}
 emit(type){for(const listener of this.listeners[type]||[])listener({});}
 focus(){globalThis.focused=this;}
 showModal(){this.open=true;}
 close(){this.open=false;this.emit('close');}
 remove(){this.isConnected=false;}
}
globalThis.document={body:new Element('body'),createElement:tag=>new Element(tag)};
const {openEntityOrbit}=await import('../search-orbit.mjs');
const entity={id:'root',name:'Example',description:'Fixture',official_links:{website:'https://example.com'}};
const records=Array.from({length:33},(_,i)=>({id:'r'+i,name:'Resource '+i,type:i%2?'community':'documentation',official_links:{website:'https://example.com/'+i},relationships:[{target:'root',status:'source_checked',source:'https://example.com/source'}]}));
const trigger=new Element('button');
await openEntityOrbit(entity,records,trigger);
const dialog=document.body.children.at(-1);
const walk=node=>[node,...node.children.flatMap(walk)];
const find=text=>walk(dialog).find(n=>n.textContent===text);
assert(find('3D could not load on this device. All recorded destinations remain available below.'));
const next=find('Next destinations'),previous=find('Previous destinations');
assert(previous.disabled);assert(!next.disabled);
next.emit('click');
assert(find('17–32 of 34 destinations · Page 2 of 3'));
assert(find('Resource 15'));
next.emit('click');
assert(next.disabled);assert(find('33–34 of 34 destinations · Page 3 of 3'));
assert.equal(globalThis.focused,previous,'Focus stays on an enabled pager control');
const filter=walk(dialog).find(n=>n.tagName==='select');filter.value='community';filter.emit('change');
assert(find('1–16 of 16 destinations · Page 1 of 1'));
assert(previous.disabled&&next.disabled);
const selection=walk(dialog).find(n=>n.className==='orbit-selection');
assert.equal(selection.children.find(n=>n.tagName==='a').href,'https://example.com/1');
find('Resource 31').emit('click');
assert.equal(selection.children.find(n=>n.tagName==='a').href,'https://example.com/31');
find('Close').emit('click');assert(!dialog.isConnected);assert.equal(globalThis.focused,trigger);
console.log('Actual orbit dialog passed: WebGL fallback, paging, filtering, selection links, focus and close cleanup.');
