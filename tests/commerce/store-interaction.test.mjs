import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const offersSource=fs.readFileSync(new URL('../../experiences/store/offers.js',import.meta.url),'utf8');
const {offers}=await import('data:text/javascript,'+encodeURIComponent(offersSource));
assert.deepEqual(Object.keys(offers),['plus','cash','checkout']);
assert(offers.cash.status.includes('No redemption'));assert(offers.plus.status.includes('not enabled'));
for(const offer of Object.values(offers))for(const link of offer.links)assert(/^\.\.\/(plus|checkout)\//.test(link.href));
const source=fs.readFileSync(new URL('../../experiences/store/store.js',import.meta.url),'utf8');
const nodes=new Map();let focused=null;const events={};
function node(id){if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',dataset:{},attrs:{},events:{},children:[],setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},focus(){focused=id},addEventListener(k,fn){this.events[k]=fn},replaceChildren(){this.children=[]},append(child){this.children.push(child)}});return nodes.get(id);}
const buttons=Object.keys(offers).map(key=>{const b=node(key);b.dataset.display=key;return b;});
const document={querySelector:node,querySelectorAll:()=>buttons,createElement:()=>({}),body:{classList:{add(){},remove(){}}},addEventListener(k,fn){events[k]=fn}};
vm.runInNewContext(source.slice(source.indexOf("const $="),source.indexOf('\ntry{')),{document,offers});
buttons[0].events.click();assert.equal(node('#offering-title').textContent,'1AGE Plus');assert.equal(node('#offering').hidden,false);assert.equal(focused,'#offering-title');assert.equal(node('#offering-actions').children.length,2);
events.keydown({key:'Escape'});assert.equal(node('#offering').hidden,true);assert.equal(focused,'plus');assert.equal(buttons[0].attrs['aria-pressed'],'false');
buttons[1].events.click();assert.equal(node('#offering-price').textContent,'Credit sales are not enabled.');assert.equal(node('#offering-actions').children.length,1);
node('#close-offering').events.click();assert.equal(focused,'cash');
node('#logo-menu').events.click();assert.equal(node('#menu').hidden,false);
console.log('Store interaction checks passed: offering integrity, display selection, links, disclosure, focus, keyboard close and menu without WebGL.');
