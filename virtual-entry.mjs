// Application entrances remain independent; legacy tools open only by explicit action.
const routes={page:'/experiences/page/',games:'/experiences/games/',exchange:'/experiences/exchange/',plus:'/experiences/plus/',store:'/experiences/store/',blog:'/experiences/blog/',cash:'/experiences/cash/'};
const labels={page:'Page',games:'Games',exchange:'Exchange',plus:'Plus',store:'Store',blog:'Blog',cash:'Cash',space:'Space',design:'Design',quest:'Quest',shop:'Shop',app:'App',world:'World',checkout:'Checkout'};
const slug=document.body.dataset.app||document.body.dataset.homeApp||(/^\/world\/(index\.html)?$/.test(location.pathname)?'world':null);
if(labels[slug]){
 const legacy=new URLSearchParams(location.search).get('workspace')==='1';
 if(routes[slug]&&!legacy&&location.pathname!==routes[slug]){location.replace(routes[slug]);}
 else{
 const body=document.body;body.classList.add('virtual-entry');
 const host=document.createElement('div');host.className='scene virtual-stage';host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label','3D '+labels[slug]+' entrance. Arrow keys rotate; plus and minus zoom.');const fallback=document.createElement('p');fallback.className='fallback-note';fallback.textContent='3D requires a supported browser. The tools remain accessible.';host.append(fallback);
 const head=document.createElement('header');head.className='virtual-header';const menu=document.createElement('button');menu.textContent='1AGE';const img=document.createElement('img');img.src='/assets/1age-logo.svg';img.alt='';menu.prepend(img);menu.setAttribute('aria-label','1AGE menu');menu.setAttribute('aria-expanded','false');const nav=document.createElement('nav');nav.hidden=true;for(const [name,url]of[['Store','/experiences/store/'],['Blog','/experiences/blog/']]){const a=document.createElement('a');a.href=url;a.textContent=name;nav.append(a);}menu.addEventListener('click',()=>{nav.hidden=!nav.hidden;menu.setAttribute('aria-expanded',String(!nav.hidden));});head.append(menu,nav);
 const title=document.createElement('section');title.className='virtual-caption';const h=document.createElement('h1');h.textContent='1AGE '+labels[slug];const p=document.createElement('p');p.textContent='Virtual platform foundation. Existing tools are available; connected services are still in development.';title.append(h,p);
 const tools=document.createElement('button');tools.className='virtual-tools-toggle';tools.textContent='Open '+labels[slug]+' controls';tools.setAttribute('aria-expanded','false');tools.addEventListener('click',()=>{const open=body.classList.toggle('virtual-tools');tools.setAttribute('aria-expanded',String(open));tools.textContent=(open?'Close ':'Open ')+labels[slug]+' controls';});
 body.append(host,head,title,tools);document.addEventListener('keydown',e=>{if(e.key==='Escape'){body.classList.remove('virtual-tools');tools.setAttribute('aria-expanded','false');nav.hidden=true;menu.setAttribute('aria-expanded','false');tools.focus();}});
 try{const {createViewer}=await import('/experiences/shared/viewer.js');const viewer=createViewer(host,{model:slug==='space'?'property':['cash','checkout'].includes(slug)?'terminal':'brand'});addEventListener('pagehide',e=>{if(!e.persisted)viewer.dispose();});}catch{fallback.textContent='3D unavailable. Open the same controls to continue.';}
 }
}
