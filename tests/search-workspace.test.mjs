import test from 'node:test';
import {readFileSync} from 'node:fs';
async function exercise(source,firstSubmit=false){
 class N{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.parentElement=null;this.listeners={};this.attributes={};this.className='';this.dataset={};this.hidden=false;this.textContent='';}
 remove(){if(this.parentElement){const p=this.parentElement;p.children.splice(p.children.indexOf(this),1);this.parentElement=null;}}
 append(...a){for(const n of a){n.remove();this.children.push(n);n.parentElement=this;}}
 prepend(n){n.remove();this.children.unshift(n);n.parentElement=this;}
 before(n){const p=this.parentElement;n.remove();p.children.splice(p.children.indexOf(this),0,n);n.parentElement=p;}
 after(n){const p=this.parentElement;n.remove();p.children.splice(p.children.indexOf(this)+1,0,n);n.parentElement=p;}
 replaceChildren(...a){for(const n of [...this.children])n.remove();this.append(...a);}
 setAttribute(k,v){this.attributes[k]=v;}
 addEventListener(k,f){(this.listeners[k]??=[]).push(f);}
 async fire(k){for(const f of this.listeners[k]||[])await f({preventDefault(){}});}
 querySelectorAll(q){const out=[];for(const c of this.children){if(q.startsWith('.')?c.className.split(' ').includes(q.slice(1)):q.startsWith('#')?c.id===q.slice(1):c.tagName===q)out.push(c);out.push(...c.querySelectorAll(q));}return out;}
 querySelector(q){return this.querySelectorAll(q)[0]||null;}
 focus(){} blur(){}
 }
 const body=new N(),header=new N(),hub=new N(),home=new N(),section=new N(),form=new N('form'),input=new N('input'),label=new N('h2'),results=new N(),rh=new N(),note=new N(),links=new N(),circle=new N('button');
 const classes=new Set();body.classList={add:(...a)=>a.forEach(x=>classes.add(x)),remove:(...a)=>a.forEach(x=>classes.delete(x)),contains:x=>classes.has(x)};
 hub.className='header-hub';header.append(hub);input.id='search-input';form.id='search-form';form.append(input);form.hidden=true;circle.className='search-circle';links.className='quick-links';home.append(circle,form,links);section.hidden=true;section.id='results-section';label.id='results-label';results.id='results';note.className='index-note';rh.className='results-header';rh.append(label,note);section.append(rh,results);body.append(header,home,section);
 const document={body,title:'1AGE',querySelector:q=>body.querySelector(q),querySelectorAll:q=>body.querySelectorAll(q),createElement:t=>new N(t),createComment:()=>new N('comment')};
 const records=[{id:'sol',name:'Solana',type:'blockchain',category:'Network',description:'Public blockchain network.',networks:['Solana'],official_links:{website:'https://solana.com/'}},{id:'docs',name:'Developer resources',type:'documentation',description:'Public docs.',official_links:{website:'https://solana.com/docs'}},{id:'bounty-fixture',name:'Test bounty',type:'bounty',reward:'100 USDC',deadline:'2026-12-01',official_links:{website:'https://example.com/bounty'}},{id:'parcel-fixture',name:'Test parcel',type:'parcel',coordinates:'12,-45',official_links:{website:'https://example.com/parcel'}}];
 class URLStub{constructor(raw){if(typeof raw!=='string'||!raw.startsWith('https://'))throw Error('invalid URL');this.href=raw;this.hostname=raw.split('/')[2];this.origin='https://'+this.hostname;this.protocol='https:';this.searchParams={set(){},delete(){}};}}
 const location=new URLStub('https://1age.com/');location.search=firstSubmit?'':'?q=solana';const storage=new Map(),events=[];
 const window={location,history:{replaceState(){}},dispatchEvent:e=>events.push(e.type),ageSearchCore:{plan:()=>({})},ageIndex:{prepare:async()=>{},load:async()=>records,search:r=>r,info:()=>({records:4,networks:1}),validLink:r=>{try{return new URLStub(r.official_links?.website);}catch{return null;}},authenticity:()=>({label:'Unverified listing'}),related:()=>[]}};
 const localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 class EventStub{constructor(type){this.type=type;}}
 class ParamsStub{get(k){return k==='q'&&!firstSubmit?'solana':null;}}
 new Function('document','window','location','localStorage','Event','URL','URLSearchParams',source)(document,window,location,localStorage,EventStub,URLStub,ParamsStub);
 if(firstSubmit){if(!section.hidden||hub.parentElement!==header)throw Error('homepage was not initially intact');input.value='solana';await form.fire('submit');}
 await Promise.resolve();await Promise.resolve();
 const checks=[];const check=(ok,label)=>{if(!ok)throw Error(label);checks.push(label);};
 check(hub.parentElement.className==='search-menu-dock','original menu mounted');
 check(results.querySelectorAll('.result-card').length===4,'fixture results rendered');
 check(!section.querySelector('.search-intelligence').hidden,'index overview visible');
 const category=n=>section.querySelectorAll('.search-category').find(x=>x.textContent===n);
 const view=n=>section.querySelectorAll('.search-view-button').find(x=>x.textContent===n);
 await category('Earn').fire('click');
 check(results.querySelectorAll('.result-card').length===1,'Earn filter');
 check(results.querySelector('.result-facts').children.some(n=>n.textContent==='100 USDC'),'reward displayed');
 await results.querySelector('.result-bookmark').fire('click');
 check(JSON.parse(storage.get('1age-search-saved-v1')).length===1,'local bookmark');
 await view('Saved').fire('click');
 check(results.querySelectorAll('.result-card').length===1&&section.querySelector('.search-intelligence').hidden,'saved view');
 await results.querySelector('.result-bookmark').fire('click');
 check(results.querySelectorAll('.result-card').length===0,'remove saved');
 await view('Discover').fire('click');
 check(results.querySelectorAll('.result-card').length===4,'Discover index');
 await category('Assets').fire('click');
 check(results.querySelectorAll('.result-card').length===1&&results.querySelector('.result-facts').children.some(n=>n.textContent==='12,-45'),'parcel fixture filter');
 await section.querySelector('.search-home-back').fire('click');
 check(hub.parentElement===header&&form.parentElement===home&&section.hidden&&!classes.has('results-open'),'original homepage restored');
 check(events.includes('1age-header-close')&&events.includes('1age-home-restored'),'menu reset');
 return checks;
}
test('interactive search workspace',async()=>{await exercise(readFileSync(new URL('../homepage-search-results.js',import.meta.url),'utf8'));});

test('first submission from untouched homepage opens identical workspace',async()=>{await exercise(readFileSync(new URL('../homepage-search-results.js',import.meta.url),'utf8'),true);});
