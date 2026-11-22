export function validatePublications(records){
 if(!Array.isArray(records)||records.length>200)throw Error('Invalid publication collection');
 const ids=new Set();
 for(const row of records){
  if(!/^[a-z0-9-]{1,80}$/.test(row.id)||ids.has(row.id))throw Error('Duplicate or invalid story identifier');ids.add(row.id);
  for(const field of ['title','description','status','technical'])if(typeof row[field]!=='string'||!row[field].trim())throw Error('Missing publication text');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||!Number.isFinite(Date.parse(row.date)))throw Error('Invalid publication date');
  if(!Array.isArray(row.body)||!row.body.every(p=>typeof p==='string'))throw Error('Invalid article body');
  if(!row.media||!['procedural','gltf','image','video'].includes(row.media.kind))throw Error('Unsupported publication media');
  for(const key of ['categories','tags','related'])if(row[key]&&(!Array.isArray(row[key])||row[key].length>30||!row[key].every(x=>typeof x==='string')))throw Error('Invalid story metadata');
 }
 for(const row of records)if((row.related||[]).some(id=>!ids.has(id)||id===row.id))throw Error('Unresolved story relationship');
 return records;
}
export function filterPublications(records,query){const words=String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);return records.filter(row=>{const text=[row.title,row.description,row.status,...row.body,...(row.categories||[]),...(row.tags||[])].join(' ').toLowerCase();return words.every(word=>text.includes(word));});}
export function storyURL(href,id){const url=new URL(href);if(id)url.searchParams.set('story',id);else url.searchParams.delete('story');return url;}
