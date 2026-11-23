const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../../experiences/page/page.js'),'utf8').split('\n').slice(1).join('\n');const nodes=new Map();let focus;const events={};
function node(id){if(!nodes.has(id))nodes.set(id,{hidden:true,events:{},attributes:{},addEventListener(type,fn){this.events[type]=fn},focus(){focus=id},setAttribute(k,v){this.attributes[k]=v}});return nodes.get(id);}
vm.runInNewContext(source.slice(0,source.indexOf('function render')),{document:{getElementById:node,addEventListener(type,fn){events[type]=fn}},createPageClient:()=>({})});
node('profile-open').events.click();assert.equal(node('panel').hidden,false);assert.equal(node('profile-view').hidden,false);assert.equal(node('public-view').hidden,true);assert.equal(focus,'panel-title');
events.keydown({key:'Escape',preventDefault(){}});assert.equal(node('panel').hidden,true);assert.equal(focus,'profile-open');
node('public-open').events.click();assert.equal(node('public-view').hidden,false);assert.equal(node('profile-view').hidden,true);
node('close-panel').events.click();assert.equal(focus,'public-open');
node('menu').events.click();assert.equal(node('menu-links').hidden,false);assert.equal(node('menu').attributes['aria-expanded'],'true');
events.keydown({key:'Escape'});assert.equal(node('menu-links').hidden,true);assert.equal(focus,'menu');
console.log('Page controls passed: section visibility, keyboard close, focus return and logo menu without WebGL.');
