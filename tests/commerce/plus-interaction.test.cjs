const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../experiences/plus/plus.js'),'utf8');
const nodes=new Map();let focused=null;
function node(id){if(!nodes.has(id))nodes.set(id,{hidden:['#membership','#destinations'].includes(id),attributes:{'aria-expanded':'false'},events:{},focus(){focused=id},setAttribute(k,v){this.attributes[k]=v},getAttribute(k){return this.attributes[k]},addEventListener(k,fn){this.events[k]=fn}});return nodes.get(id);}
const state=new Set(),events={};const document={querySelector:node,body:{classList:{toggle(k,on){if(on)state.add(k);else state.delete(k)}}},addEventListener(k,fn){events[k]=fn}};
// The actual UI remains functional before the optional renderer starts or if its import fails.
vm.runInNewContext(source.slice(0,source.indexOf('\ntry {')),{document});
node('#plus-trigger').events.click();assert.equal(node('#membership').hidden,false);assert.equal(node('#plus-trigger').attributes['aria-expanded'],'true');assert.equal(focused,'#membership-title');assert(state.has('member-open'));
events.keydown({key:'Escape',preventDefault(){}});assert.equal(node('#membership').hidden,true);assert.equal(focused,'#plus-trigger');
node('#logo-menu').events.click();assert.equal(node('#destinations').hidden,false);
events.keydown({key:'Escape'});assert.equal(node('#destinations').hidden,true);assert.equal(focused,'#logo-menu');
node('#plus-trigger').events.click();node('#close-membership').events.click();assert.equal(node('#membership').hidden,true);
console.log('Plus controls passed: open/close, keyboard dismissal, focus restoration, logo menu, without requiring WebGL.');
