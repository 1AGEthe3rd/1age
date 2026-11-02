/* Reusable receiver: the host owns pairing; an experience reads semantic axes/actions. */
(()=>{
 'use strict';
 let latest={move:[0,0],look:[0,0],buttons:{}},events=[],last=0,connected=false,lastId=0,session=null;
 const zero=()=>({move:[0,0],look:[0,0],buttons:{}});
 let registered=null,notes=null;
 function deliverText(text){
  const event=new CustomEvent('oneage:text',{detail:{text},cancelable:true});
  if(!window.dispatchEvent(event))return;
  let target=registered||document.activeElement;
  const eligible=node=>node&&['INPUT','TEXTAREA'].includes(node.tagName)&&!node.disabled&&!node.readOnly&&node.type!=='password'&&typeof node.setRangeText==='function';
  if(!eligible(target)){
   if(!notes){
    const panel=document.createElement('section');panel.id='oneage-phone-notes';
    Object.assign(panel.style,{position:'fixed',right:'16px',top:'82px',width:'min(320px,calc(100vw - 32px))',background:'#07100ff5',border:'1px solid #1bfd9c',borderRadius:'16px',padding:'14px',zIndex:100,color:'#e2ffdc'});
    const title=document.createElement('strong');title.textContent='1AGE · Local phone notes';panel.append(title);
    const close=document.createElement('button');close.textContent='Hide';close.onclick=()=>{panel.hidden=true;};panel.append(close);
    notes=document.createElement('textarea');notes.setAttribute('aria-label','Local text from phone');notes.rows=5;Object.assign(notes.style,{width:'100%',marginTop:'10px',font:'16px system-ui',background:'#09120c',color:'#fff'});panel.append(notes);document.body.append(panel);
    for(const name of ['keydown','keyup'])notes.addEventListener(name,e=>e.stopPropagation());
   }
   notes.parentElement.hidden=false;target=notes;
  }
  try{target.setRangeText(text,target.selectionStart??target.value.length,target.selectionEnd??target.value.length,'end');target.dispatchEvent(new Event('input',{bubbles:true}));}
  catch{target.value+=text;target.dispatchEvent(new Event('input',{bubbles:true}));}
 }
 function clear(){latest=zero();events=[];connected=false;}
 addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='oneage-phone')return;
  const data=event.data;if(data.session&&data.session!==session){session=data.session;lastId=0;events=[];}last=performance.now();connected=!!data.connected;
  latest=connected?data.state:zero();
  for(const action of data.events||[]){if(action.id>lastId){lastId=action.id;if(connected){if(action.type==='text')deliverText(action.text);else if(action.button)events.push(action.button);}}}
  if(!connected)events=[];
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 window.OneAGEPhone={registerTextTarget(element){registered=element;},sample(){if(performance.now()-last>350)clear();return latest;},consume(){if(performance.now()-last>350)clear();const out=events;events=[];return out;},connected(){return connected&&performance.now()-last<350;}};
})();
