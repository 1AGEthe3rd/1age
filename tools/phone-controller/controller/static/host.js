'use strict';
const suppliedToken=new URLSearchParams(location.hash.slice(1)).get('token');
if(suppliedToken)sessionStorage.setItem('oneage-host-token',suppliedToken);
const token=suppliedToken||sessionStorage.getItem('oneage-host-token');
history.replaceState(null,'',location.pathname);
const $=s=>document.querySelector(s), frame=$('#cafe');
let socket=null,expiry=0,qrObject=null,active=false,generation=0;
function relay(data){frame.contentWindow?.postMessage({...data,type:'oneage-phone'},location.origin);}
function reset(){active=false;relay({state:{move:[0,0],look:[0,0],buttons:{}},events:[],connected:false});}
async function pair(){
 const current=++generation;let pairedOnce=false;reset();socket?.close();
 $('#pair').hidden=false;$('#error').textContent='';$('#status').textContent='Creating pairing code…';
 try{
  if(!token)throw Error('Open the complete computer link printed in the terminal.');
  const response=await fetch('/api/session',{method:'POST',headers:{Authorization:'Bearer '+token}});
  if(!response.ok)throw Error('Could not create a pairing session. Reopen the computer link.');
  const session=await response.json();if(current!==generation)return;
  $('#pin').textContent=session.pin;$('#url').textContent=session.controllerUrl;
  expiry=Date.now()+session.expiresIn*1000;
  const qr=await fetch('/api/qr',{headers:{Authorization:'Bearer '+token}});
  if(!qr.ok)throw Error('QR unavailable. Use the address and PIN.');
  if(qrObject)URL.revokeObjectURL(qrObject);qrObject=URL.createObjectURL(await qr.blob());$('#qr').src=qrObject;
  const ws=new WebSocket(location.origin.replace(/^http/,'ws')+'/ws');socket=ws;
  ws.onopen=()=>ws.send(JSON.stringify({id:session.id,role:'host',token}));
  ws.onmessage=event=>{
   if(current!==generation)return;
   const data=JSON.parse(event.data);if(data.type!=='state')return;
   active=data.connected||data.native;
   if(data.paired&&!pairedOnce){pairedOnce=true;$('#pair').hidden=true;}
   const focused=document.hasFocus()&&!document.hidden;
   relay(focused?{...data,session:session.id}:{state:{move:[0,0],look:[0,0],buttons:{}},events:[],connected:false});
   if(data.events.length)ws.send(JSON.stringify({ack:data.events.at(-1).id}));
   $('#status').textContent=data.native?'Controlling native World':active?'Phone connected':data.paired?'Phone paused / disconnected':'Waiting for phone';
   if(active){$('#pin').textContent='Paired';$('#qr').hidden=true;$('#timer').textContent='Session active · use Pair phone for a new session';}
  };
  ws.onclose=()=>{if(current===generation){reset();$('#status').textContent='Session ended — pair again';}};
  ws.onerror=()=>{$('#error').textContent='Connection failed. Keep the controller terminal running.';};
  $('#qr').hidden=false;
 }catch(error){$('#error').textContent=error.message;$('#status').textContent='Pairing unavailable';}
}
$('#new').onclick=pair;$('#show').onclick=()=>{$('#pair').hidden=!$('#pair').hidden;};
addEventListener('blur',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
setInterval(()=>{if(!active&&expiry)$('#timer').textContent=Date.now()<expiry?'Code expires in '+Math.ceil((expiry-Date.now())/1000)+' seconds':'Code expired — click Pair phone';},500);
pair();

$('#native').onclick=async()=>{try{const response=await fetch('/api/native/open',{method:'POST',headers:{Authorization:'Bearer '+token}});if(!response.ok)throw Error(await response.text());$('#pair').hidden=true;}catch(error){$('#error').textContent=error.message;$('#pair').hidden=false;}};

$('#hide-pair').onclick=()=>{$('#pair').hidden=true;};
