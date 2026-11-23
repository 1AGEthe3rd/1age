// Pure data boundary shared by the 3D view and its accessible destination list.
export function safeDestination(value) {
 try {const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password ? url.href : null;}catch{return null;}
}
export function entityDestinations(entity,records,{limit=16}={}) {
 const nodes=[],seen=new Set();
 function add(id,name,type,url,evidence){url=safeDestination(url);const key=type==='person'?'person:'+id:url;if(!url||seen.has(key))return;seen.add(key);nodes.push({id,name,type,url,evidence:safeDestination(evidence)});}
 for(const [kind,url] of Object.entries(entity.official_links||{}))add('link:'+kind,kind==='website'?'Website':kind,kind,url,entity.source_review?.evidence?.[0]||null);
 for(const item of records) {
  const relation=(item.relationships||[]).find(r=>r.target===entity.id&&r.status==='source_checked'&&safeDestination(r.source)) ||
   (entity.relationships||[]).find(r=>r.target===item.id&&r.status==='source_checked'&&safeDestination(r.source));
  if(item.id!==entity.id&&relation)add(item.id,item.name,item.type,item.official_links?.website,relation.source);
 }
 return nodes.slice(0,limit);
}

// Keep all public destinations discoverable without loading them all into the scene.
export function destinationPage(nodes,{page=0,category='all',size=16}={}) {
 const pageSize=Number.isInteger(size)?Math.max(1,Math.min(16,size)):16;
 const filtered=category==='all'?nodes:nodes.filter(node=>node.type===category);
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize));
 const current=Math.min(pages-1,Math.max(0,Number.isInteger(page)?page:0));
 return {nodes:filtered.slice(current*pageSize,(current+1)*pageSize),page:current,pages,total:filtered.length,start:filtered.length?current*pageSize+1:0,end:Math.min((current+1)*pageSize,filtered.length)};
}
