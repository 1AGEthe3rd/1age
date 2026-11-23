const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../search-core').createEngine(require('../assets/vendor/minisearch-7.2.0'));
const data=require('../data/search-index.json');
const cases=[['Jupiter docs','jupiter-docs','developers'],['Helius docs','helius-docs','developers'],['Phantom docs','phantom-docs','developers'],['Jupiter discord','jupiter-discord','communities'],['Jupiter social','jupiter-developer-social','social'],['Phantom support','phantom-help','content']];
const report=cases.map(([query,id,scope])=>{const t=performance.now(),rows=core.search(data,query);assert(rows.slice(0,5).some(r=>r.id===id),query);assert(core.search(data,query,scope).some(r=>r.id===id),query+' filter');const record=data.find(r=>r.id===id);assert(record.source_review.evidence.length);const parent=record.relationships[0].target;assert(core.related(data,parent).some(r=>r.id===id));return {query,count:rows.length,top:rows.slice(0,5).map(r=>r.id),scope,milliseconds:+(performance.now()-t).toFixed(2)};});
assert.equal(core.search(data,'zzresourceunknownzz').length,0);
assert(!core.related([{id:'a',relationships:[{target:'b',status:'inferred'}]},{id:'b'}],'b').length);
for(const id of ['jupiter','helius','phantom'])assert(data.find(r=>r.id===id).official_links.docs.startsWith('https://'));
fs.writeFileSync(path.join(__dirname,'../reports/project-resource-search-017.json'),JSON.stringify({records:data.length,cases:report,notes:'Publisher linkage checked; not an identity/security guarantee. X content inaccessible, so only source-page linkage checked.'},null,2)+'\n');console.log(JSON.stringify(report,null,2));
