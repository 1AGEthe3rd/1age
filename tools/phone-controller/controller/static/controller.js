'use strict';
const $=s=>document.querySelector(s), invite=new URLSearchParams(location.hash.slice(1)).get('invite');
history.replaceState(null,'',location.pathname);
let socket=null,credentials=null,wake=null;
const state={move:[0,0],look:[0,0],buttons:{}};
const contacts=new Map();
function send(){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(state));}
function reset(){state.move=[0,0];state.look=[0,0];state.buttons={};contacts.clear();document.querySelectorAll('.thumb').forEach(e=>e.style.transform='');document.querySelectorAll('.held').forEach(e=>e.classList.remove('held'));send();}
function end(id){const contact=contacts.get(id);if(!contact)return;contacts.delete(id);if(contact.role==='move'||contact.role==='look'){state[contact.role]=[0,0];contact.element.firstElementChild.style.transform='';}else{state.buttons[contact.role]=false;contact.element.classList.remove('held');}send();}
function drag(event){const contact=contacts.get(event.pointerId);if(!contact||!['move','look'].includes(contact.role))return;const rect=contact.element.getBoundingClientRect(),radius=rect.width/2;let x=(event.clientX-rect.left-radius)/radius,y=(event.clientY-rect.top-radius)/radius;const length=Math.hypot(x,y),limit=Math.max(1,length);x/=limit;y/=limit;const strength=Math.max(0,(Math.min(1,length)-.08)/.92);state[contact.role]=length>.08?[x*strength,y*strength]:[0,0];contact.element.firstElementChild.style.transform=`translate(${x*radius*.44}px,${y*radius*.44}px)`;}
for(const [id,role] of [['left','move'],['right','look']]){const element=$('#'+id);element.addEventListener('pointerdown',event=>{event.preventDefault();if([...contacts.values()].some(c=>c.role===role))return;element.setPointerCapture(event.pointerId);contacts.set(event.pointerId,{role,element});drag(event);send();});element.addEventListener('pointermove',drag);for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,event=>end(event.pointerId));}
for(const element of document.querySelectorAll('[data-button]')){element.addEventListener('pointerdown',event=>{event.preventDefault();const role=element.dataset.button;if([...contacts.values()].some(c=>c.role===role))return;element.setPointerCapture(event.pointerId);contacts.set(event.pointerId,{role,element});state.buttons[role]=true;element.classList.add('held');send();});for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,event=>end(event.pointerId));element.addEventListener('contextmenu',event=>event.preventDefault());}
async function keepAwake(){try{wake=await navigator.wakeLock?.request('screen');}catch{}}
async function pair(event){event?.preventDefault();$('#error').textContent='';$('#connect').disabled=true;try{const response=await fetch('/api/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(invite&&!event?{invite}:{pin:$('#pin').value})});if(!response.ok)throw Error(await response.text());credentials=await response.json();$('#pairing').hidden=true;$('#pad').hidden=false;connect();await keepAwake();}catch(error){$('#error').textContent=error.message;}finally{$('#connect').disabled=false;}}
function connect(){socket=new WebSocket(location.origin.replace(/^http/,'ws')+'/ws');socket.onopen=()=>socket.send(JSON.stringify({...credentials,role:'phone'}));socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.type==='context'){$('#keyboard-mode').hidden=!!message.native;if(message.native){$('#keyboard-panel').hidden=true;for(const selector of ['#left','#right','#actions','#guide','#rotate'])$(selector).hidden=false;reset();}$('#native-controls').hidden=!message.native;$('#guide').textContent=message.native?'L move · R look · A jump · X use · Y rotate / fly · B undo / sprint · Menu build toggle':'L move · R look · A / X interact · B sprint / close';}if(message.type==='ready'){$('#status').textContent='Connected';$('#disconnect').textContent='';send();}};socket.onclose=()=>{reset();$('#status').textContent='Disconnected';$('#disconnect').textContent='Pair again from the computer to resume.';};socket.onerror=()=>{$('#disconnect').textContent='Connection lost. Check Wi-Fi and the computer terminal.';};}
setInterval(send,33);addEventListener('blur',reset);addEventListener('pagehide',()=>{reset();socket?.close();});addEventListener('orientationchange',reset);document.addEventListener('visibilitychange',()=>{reset();if(!document.hidden)keepAwake();});$('#form').addEventListener('submit',pair);if(invite)pair();

// Keyboard is a separate input mode; gamepad motion is released when switching.
let textSequence=0;
const gamepadElements=['#left','#right','#actions','#guide','#rotate'];
$('#keyboard-mode').onclick=()=>{
 reset();const keyboard=$('#keyboard-panel');keyboard.hidden=!keyboard.hidden;
 for(const selector of gamepadElements)$(selector).hidden=!keyboard.hidden;
 $('#keyboard-mode').textContent=keyboard.hidden?'Keyboard':'Gamepad';
 if(!keyboard.hidden)$('#keyboard-text').focus();
};
$('#keyboard-form').onsubmit=event=>{
 event.preventDefault();const text=$('#keyboard-text').value;
 if(!text.trim())return;
 if(new TextEncoder().encode(text).length>2000){$('#keyboard-status').textContent='Please send a shorter text (up to 2000 bytes).';return;}
 if(socket?.readyState!==WebSocket.OPEN){$('#keyboard-status').textContent='Disconnected — pair again on the computer.';return;}
 const id=Date.now().toString(36)+'-'+(++textSequence);
 socket.send(JSON.stringify({type:'text',id,text}));
 $('#keyboard-status').textContent='Sent to paired 1AGE screen';$('#keyboard-text').value='';
};
