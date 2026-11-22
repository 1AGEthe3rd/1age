import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {entityDestinations,destinationPage} from '../search-orbit-model.mjs';
const center={id:'center',name:'Center',official_links:{website:'https://example.com'},source_review:{evidence:['javascript:alert(1)']}};
const records=Array.from({length:41},(_,i)=>({id:'resource-'+i,name:'Resource '+i,type:i%2?'community':'documentation',official_links:{website:'https://example.com/'+i},relationships:[{target:'center',status:'source_checked',source:'https://example.com/source'}]}));
const all=entityDestinations(center,records,{limit:Infinity});
assert.equal(all.length,42);
assert.equal(all[0].evidence,null,'Unsafe provenance links must not reach the UI');
const pages=[0,1,2].map(page=>destinationPage(all,{page}));
assert.deepEqual(pages.map(p=>p.nodes.length),[16,16,10]);
assert.equal(new Set(pages.flatMap(p=>p.nodes.map(n=>n.id))).size,42,'Every destination is reachable exactly once');
assert.equal(destinationPage(all,{page:999}).page,2);
assert.equal(destinationPage(all,{page:-1}).page,0);
const filtered=destinationPage(all,{category:'community',page:2});
assert.equal(filtered.total,20);assert.equal(filtered.page,1);assert(filtered.nodes.every(n=>n.type==='community'));
assert.equal(destinationPage(all,{size:1000}).nodes.length,16,'Filtering cannot expand the WebGL scene budget');
assert.equal(destinationPage([]).total,0);assert.equal(destinationPage([]).pages,1);
assert.equal(destinationPage(all,{category:'missing'}).nodes.length,0);
const data=JSON.parse(readFileSync(new URL('../data/search-index.json',import.meta.url)));
for(const id of ['solana','jupiter','helius','phantom']){
 const entity=data.find(row=>row.id===id);assert(entity,id);
 const nodes=entityDestinations(entity,data,{limit:Infinity});
 const count=destinationPage(nodes).pages;
 assert.equal(new Set(Array.from({length:count},(_,page)=>destinationPage(nodes,{page}).nodes).flat().map(n=>n.id)).size,nodes.length);
 console.log(id+': '+nodes.length+' recorded destinations across '+count+' page(s)');
}
console.log('Orbit paging checks passed: complete coverage, category filter, bounded scene, safe evidence and real catalog.');
