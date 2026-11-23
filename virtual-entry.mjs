import '/experiences/shared/gamepad.mjs';
// Independent spatial entrances. Legacy workspaces are not public launch destinations.
const routes={page:'https://1age.page/',space:'https://1age.space/',games:'https://1age.games/',exchange:'https://1age.exchange/',quest:'https://1age.quest/',cash:'https://1age.cash/',plus:'https://1age.plus/',store:'https://1age.store/',blog:'https://1age.blog/',design:'https://1age.design/',shop:'https://1age.shop/',app:'https://1age.app/',world:'https://1age.world/'};
const labels={page:'Page',games:'Games',exchange:'Exchange',plus:'Plus',store:'Store',blog:'Blog',cash:'Cash',space:'Space',design:'Design',quest:'Quest',shop:'Shop',app:'App',world:'World',checkout:'Checkout'};
const slug=document.body.dataset.app||document.body.dataset.homeApp||(/^\/world\/(index\.html)?$/.test(location.pathname)?'world':null);
const foundations=new Set(['quest','design','shop','app']);
if(labels[slug]){
 const foundation=foundations.has(slug);
 const legacy=!foundation&&new URLSearchParams(location.search).get('workspace')==='1';
 if(routes[slug]&&!legacy&&location.pathname!==routes[slug]){location.replace(routes[slug]);}
 else{
  const body=document.body;body.classList.add('virtual-entry');
  if(foundation)body.classList.add('virtual-foundation');
  const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
  const host=el('div');host.className='scene virtual-stage';host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label','3D '+labels[slug]+' environment. Arrow keys rotate; plus and minus zoom.');
  const fallback=el('p','Loading the 3D environment. Scene controls are keyboard accessible.');fallback.className='fallback-note';host.append(fallback);
  const head=el('header');head.className='virtual-header';const menu=el('button');const img=el('img');img.src='/assets/1age-logo.svg';img.alt='';menu.prepend(img);menu.setAttribute('aria-label','1AGE menu');menu.setAttribute('aria-expanded','false');
  const nav=el('nav');nav.hidden=true;for(const [name,url]of[['Store','https://1age.store/'],['Blog','https://1age.blog/']]){const a=el('a',name);a.href=url;nav.append(a);}menu.addEventListener('click',()=>{nav.hidden=!nav.hidden;menu.setAttribute('aria-expanded',String(!nav.hidden));});const home=el('a','Home');home.href='https://1age.com/';head.append(menu,nav,home);
  let viewer;const tools=el('button',foundation?'Scene controls':'Open '+labels[slug]+' controls');tools.className='virtual-tools-toggle';tools.setAttribute('aria-expanded','false');
  const camera=el('section');camera.className='virtual-camera';camera.hidden=true;camera.setAttribute('aria-label','3D scene controls');
  for(const [name,action]of[['Turn left','left'],['Turn right','right'],['Zoom in','in'],['Zoom out','out'],['Reset view','reset']]){const button=el('button',name);button.addEventListener('click',()=>viewer?.action?.(action));camera.append(button);}
  tools.addEventListener('click',()=>{if(foundation){camera.hidden=!camera.hidden;tools.setAttribute('aria-expanded',String(!camera.hidden));return;}const open=body.classList.toggle('virtual-tools');tools.setAttribute('aria-expanded',String(open));tools.textContent=(open?'Close ':'Open ')+labels[slug]+' controls';});
  body.append(host,head,tools);if(foundation)body.append(camera);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){body.classList.remove('virtual-tools');camera.hidden=true;tools.setAttribute('aria-expanded','false');nav.hidden=true;menu.setAttribute('aria-expanded','false');tools.focus();}});
  try{const {createViewer}=await import('/experiences/shared/viewer.js');viewer=createViewer(host,{model:foundation?slug:slug==='space'?'property':['cash','checkout'].includes(slug)?'terminal':'brand'});addEventListener('pagehide',event=>{if(!event.persisted)viewer.dispose();});}
  catch{fallback.textContent='The 3D environment is unavailable in this browser. Use a WebGL-capable browser to enter this virtual platform.';}
 }
}
