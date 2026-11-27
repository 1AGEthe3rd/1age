const el=(tag,text,parent)=>{const e=document.createElement(tag);if(text)e.textContent=text;parent.append(e);return e;};
const link=(parent,name,url)=>{const a=el('a',name,parent);a.href=url;return a;};
const note=(parent,text)=>el('p',text,parent);
export function mountPanel(parent,id){
if(id==='studio'){note(parent,'Write an original comedy concept. This draft remains local to this open panel; no publication or upload.');const title=el('input','',parent);title.placeholder='Performance or sketch title';title.maxLength=80;const text=el('textarea','',parent);text.placeholder='Your original comedy concept';text.maxLength=1800;text.rows=6;const count=el('p','0 / 1800 characters',parent);text.addEventListener('input',()=>count.textContent=text.value.length+' / 1800 characters');return;}
if(id==='standup'){note(parent,'Stand-up performances and comedy venues will be discoverable here. No live performance is currently connected.');link(parent,'Explore 1AGE World','https://1age.world/');return;}
if(id==='sketch'){note(parent,'Comedy sketches, memes and funny videos will support creator-owned or authorized content. No public comedy feed is loaded.');return;}
for(const x of ['Stand-up','Sketches','Memes','Comedy creators','Community performances'])el('p',x,parent);note(parent,'Comedy discovery preview. A real media catalog and public posting service are not connected.');link(parent,'1AGE Page · creator identity','https://1age.page/');}
