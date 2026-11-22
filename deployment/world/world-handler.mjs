// Serve the unchanged Godot engine from bounded static chunks. No remote origin.
export function createWorldHandler(manifest) {
 return {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname!==manifest.path)return env.ASSETS.fetch(request);
  if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{Allow:'GET, HEAD'}});
  const headers={'Content-Type':'application/wasm','Content-Length':String(manifest.bytes),'ETag':'"'+manifest.sha256+'"','Cache-Control':'public, max-age=3600','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex'};
  if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
  if(request.method==='HEAD')return new Response(null,{headers});
  const get=async path=>{const response=await env.ASSETS.fetch(new Request(new URL(path,url.origin)));if(!response.ok||!response.body)throw Error('Engine chunk unavailable');return response.body.getReader();};
  let reader;
  try{reader=await get(manifest.chunks[0].path);}catch{return new Response('Engine temporarily unavailable',{status:502});}
  let index=0;
  const stream=new ReadableStream({
   async pull(controller){
    try{
     while(true){const result=await reader.read();if(!result.done){controller.enqueue(result.value);return;}
      reader.releaseLock();index++;
      if(index===manifest.chunks.length){controller.close();return;}
      reader=await get(manifest.chunks[index].path);
     }
    }catch(error){controller.error(error);}
   },
   cancel(reason){return reader?.cancel(reason);}
  });
  return new Response(stream,{headers});
 }};
}
