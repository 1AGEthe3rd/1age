import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../homepage-ticker-layout.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const controls=readFileSync(new URL('../homepage-home-controls.js',import.meta.url),'utf8');
test('ticker starts hidden, reveals once on globe activation and respects search suppression',()=>{
 const classes=new Set();let focused=false,observer,anchored=false;
 const events={};
 const ticker={hidden:false,inert:false,style:{setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}}};
 const body={append(n){anchored=n===ticker;},classList:{contains:c=>classes.has(c),add:c=>classes.add(c)}};
 const document={body,querySelector:()=>ticker,activeElement:{matches:()=>focused},addEventListener(){}};
 const window={addEventListener:(name,fn)=>{events[name]=fn;}};
 new Function('document','window','MutationObserver','requestAnimationFrame',source)(document,window,function(cb){observer=cb;this.observe=()=>{};},cb=>cb());
 const check=hidden=>{assert.equal(ticker.hidden,hidden);assert.equal(ticker.inert,hidden);assert.equal(ticker.style.display==='none',hidden);};
 assert.ok(anchored);check(true);
 events.pageshow();check(true);
 classes.add('project-selected');observer();check(true);
 classes.add('search-open');observer();check(true);
 classes.delete('search-open');events['1age-home-restored']();check(true);
 events['1age-globe-activated']();check(false);
 events['1age-globe-activated']();check(false);
 focused=true;observer();check(true);focused=false;observer();check(false);
 for(const c of ['search-open','results-open','information-open']){classes.add(c);observer();check(true);classes.delete(c);observer();check(false);}
 events.pageshow();check(false);
});
test('first paint is hidden and only accepted globe click activates ticker',()=>{
 assert.match(html,/<section class="living-ticker"[^>]*hidden inert style="display:none!important"/);
 const click=controls.split('\n').find(l=>l.includes("globe.addEventListener('click'"));
 assert.ok(click.indexOf('if(dragged||multi)')<click.indexOf("1age-globe-activated"));
 assert.equal(controls.split('1age-globe-activated').length,2);
});