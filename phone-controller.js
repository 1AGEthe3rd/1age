/* 1AGE hosted controller adapter: experience consumes shared semantic input. */
(()=>{
'use strict';
let latest={move:[0,0],look:[0,0],buttons:{}},events=[],last=0,lastId=0,session=null,ws=null,relay='',generation=0,qrURL=null;
if(!document.querySelector('.project-orbit'))return;
const zero=()=>({move:[0,0],look:[0,0],buttons:{}});
function clear(){latest=zero();events=[];last=0;}
window.OneAGEPhone={sample(){if(performance.now()-last>350||document.hidden||!document.hasFocus())clear();return latest;},consume(){if(performance.now()-last>350||document.hidden||!document.hasFocus())clear();const out=events;events=[];return out;},connected(){return performance.now()-last<350&&last>0;}};
const style=document.createElement('style');style.textContent=`#oneage-pair[hidden]{display:none!important}#oneage-phone{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:80;border:1px solid #1bfd9c;border-radius:22px;padding:9px 14px;background:#07100f;color:#e2ffdc;font:14px system-ui;cursor:pointer}#oneage-pair{position:fixed;bottom:62px;left:50%;transform:translateX(-50%);z-index:81;width:min(270px,calc(100vw - 32px));padding:16px;border:1px solid #1bfd9c;border-radius:18px;background:#07100ff5;color:#e2ffdc;font:14px system-ui;box-shadow:0 12px 50px #000}#oneage-pair p{line-height:1.4;overflow-wrap:anywhere}#oneage-pair img{display:block;width:150px;height:150px;margin:12px auto}#oneage-pair button{font:13px system-ui;border:1px solid #1bfd9c;border-radius:18px;background:#07100f;color:#e2ffdc;padding:8px 12px;cursor:pointer}#oneage-pair [hidden]{display:none!important}#oneage-pin{text-align:center;font-size:28px;letter-spacing:6px;color:#1bfd9c}#oneage-close{float:right}#oneage-message{font-size:12px}#oneage-phone-status{font-size:12px;color:#b7d5bf}`;
document.head.append(style);
const button=document.createElement('button');button.id='oneage-phone';button.textContent='Connect phone';button.type='button';
// Reuse the café's existing toolbar instead of covering its buttons.
const toolbar=document.querySelector('#tools');if(toolbar){button.style.position='static';toolbar.append(button);}else document.body.append(button);
const panel=document.createElement('aside');panel.id='oneage-pair';panel.hidden=true;panel.setAttribute('aria-label','Phone controller pairing');panel.innerHTML='<button id="oneage-close" aria-label="Hide pairing">×</button><strong>Pair phone</strong><p id="oneage-phone-status">Create a pairing code</p><img id="oneage-qr" alt="Pairing QR" hidden><div id="oneage-pin"></div><p id="oneage-address"></p><p id="oneage-message" role="status"></p><button id="oneage-new">New code</button> <button id="oneage-end" hidden>Disconnect</button>';
document.body.append(panel);
const $=s=>panel.querySelector(s);
$('#oneage-close').onclick=()=>{panel.hidden=true;};
function report(text){$('#oneage-phone-status').textContent=text;}
function auth(){return {Authorization:'Bearer '+session.token};}
async function stop(){generation++;if(qrURL){URL.revokeObjectURL(qrURL);qrURL=null;}clear();ws?.close();ws=null;const old=session;session=null;if(old&&relay)try{await fetch(relay+'/api/session/'+old.id,{method:'DELETE',headers:{Authorization:'Bearer '+old.token}});}catch{}button.textContent='Phone controller';$('#oneage-end').hidden=true;$('#oneage-qr').hidden=true;$('#oneage-pin').textContent='';report('Disconnected');}
async function create(){
 if(button.disabled)return;button.disabled=true;$('#oneage-new').disabled=true;
 await stop();const current=generation;panel.hidden=false;report('Creating code…');$('#oneage-message').textContent='';
 try{
  const configResponse=await fetch('/phone-controller-config.json',{cache:'no-store'});if(!configResponse.ok)throw Error('Phone pairing service has not been configured yet.');
  const config=await configResponse.json(),url=new URL(config.relay);
  if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username)throw Error('Pairing requires a configured HTTPS service.');
  relay=url.origin;
  const response=await fetch(relay+'/api/session',{method:'POST'});if(!response.ok)throw Error(await response.text());
  const credentials=await response.json();if(current!==generation)return;session=credentials;lastId=0;
  const qr=await fetch(relay+'/api/session/'+session.id+'/qr',{headers:auth()});if(!qr.ok)throw Error('QR unavailable. Try a new code.');
  const image=await qr.blob();if(current!==generation)return;
  if(qrURL)URL.revokeObjectURL(qrURL);qrURL=URL.createObjectURL(image);$('#oneage-qr').src=qrURL;$('#oneage-qr').hidden=false;
  $('#oneage-pin').textContent=session.pin;$('#oneage-address').textContent=session.controllerUrl;$('#oneage-end').hidden=false;
  $('#oneage-message').textContent='Scan with your phone, or open the address and enter the PIN. Code expires in 2 minutes; session lasts 30 minutes.';
  let pairedOnce=false;
  const socket=new WebSocket(relay.replace(/^http/,'ws')+'/ws');ws=socket;
  socket.onopen=()=>{if(current===generation&&session)socket.send(JSON.stringify({...session,role:'host'}));};
  socket.onmessage=event=>{
   if(current!==generation)return;
   const data=JSON.parse(event.data);if(data.type!=='state')return;
   if(data.paired&&!pairedOnce){pairedOnce=true;panel.hidden=true;$('#oneage-qr').hidden=true;$('#oneage-pin').textContent='Paired';}
   const focused=document.hasFocus()&&!document.hidden;
   latest=data.connected&&focused?data.state:zero();last=data.connected&&focused?performance.now():0;
   for(const action of data.events||[]){if(action.id>lastId){lastId=action.id;if(data.connected&&focused)events.length<16&&events.push(action.button);}}
   if(data.events?.length)socket.send(JSON.stringify({ack:data.events.at(-1).id}));
   button.textContent=data.connected?'Phone connected':'Phone controller';report(data.connected?(focused?'Connected':'Click the homepage to resume control'):data.paired?'Phone paused / disconnected':'Waiting for phone');
  };
  socket.onclose=()=>{if(current===generation){clear();report('Session ended. Create a new code to reconnect.');button.textContent='Pair phone again';}};
  socket.onerror=()=>report('Could not reach pairing service. Try a new code.');
  report('Waiting for phone');
 }catch(error){clear();report('Pairing unavailable');$('#oneage-message').textContent=error.message;}finally{button.disabled=false;$('#oneage-new').disabled=false;}
}
// Use the existing homepage navigation events and selected destination.
let frame=0,previous=0,nextStep=0;
function drive(now){
 const dt=Math.min(.05,(now-previous)/1000);previous=now;
 const input=window.OneAGEPhone.sample(), actions=window.OneAGEPhone.consume();
 if(panel.hidden&&!document.querySelector('dialog[open]')&&!document.querySelector('input:focus,textarea:focus,[contenteditable]:focus')){
  if(Math.abs(input.look[0])>.02)window.dispatchEvent(new CustomEvent('1age-world-turn',{detail:-input.look[0]*dt*.10}));
  if(Math.abs(input.move[0])<=.5)nextStep=0;
  else if(now>=nextStep){window.dispatchEvent(new CustomEvent('1age-orbit-step',{detail:Math.sign(input.move[0])}));nextStep=now+650;}
  if(actions.includes('A'))document.querySelector('.project-planet.is-selected')?.click();
 }
 frame=requestAnimationFrame(drive);
}
frame=requestAnimationFrame(drive);
addEventListener('pagehide',()=>cancelAnimationFrame(frame));
addEventListener('pageshow',event=>{if(event.persisted)frame=requestAnimationFrame(drive);});
button.onclick=()=>{panel.hidden=!panel.hidden;if(!session&&!panel.hidden)create();};$('#oneage-new').onclick=create;$('#oneage-end').onclick=stop;
addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});addEventListener('pagehide',()=>{clear();ws?.close();});
})();
