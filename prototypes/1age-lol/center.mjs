import * as THREE from '../../experiences/shared/vendor/three.module.js';
import {createWalker} from './walking.mjs';
import {createFloorMaterial,addArchitecture,addContactShade} from './architecture.mjs';
import {mountPanel} from './panels.mjs';
const $=s=>document.querySelector(s),stage=$('#scene'),status=$('#status'),panel=$('#panel'),body=$('#panel-body');
try{
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x03060d);
 const camera=new THREE.PerspectiveCamera(64,1,.08,260),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;stage.append(renderer.domElement);
 let quality=1.5;
 const std=(color,metalness=.2,roughness=.45)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const graphite=std(0x111a24,.43,.32),platinum=std(0xb8c4cb,.44,.28),bronze=std(0x997c55,.45,.35),stone=createFloorMaterial(),cyan=new THREE.MeshBasicMaterial({color:0x95dfff}),warm=new THREE.MeshBasicMaterial({color:0xffe2b4});
 const glass=new THREE.MeshPhysicalMaterial({color:0x9edaff,transparent:true,opacity:.075,roughness:.15,metalness:.1,side:THREE.DoubleSide,depthWrite:false});
 const mesh=(g,m,x,y,z,parent=scene)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};
 const box=(w,h,d,m,x,y,z,parent=scene)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
 const cyl=(a,b,h,m,x,y,z,parent=scene)=>mesh(new THREE.CylinderGeometry(a,b,h,64),m,x,y,z,parent);
 const ring=(r,t,m,y,parent=scene)=>{const o=mesh(new THREE.TorusGeometry(r,t,8,96),m,0,y,0,parent);o.rotation.x=Math.PI/2;return o;};
 scene.add(new THREE.HemisphereLight(0xe4f0ff,0x48515a,1.65));
 const sun=new THREE.DirectionalLight(0xe7f1ff,1.85);sun.position.set(-12,14,-8);scene.add(sun);
 cyl(11.4,11.5,.32,stone,0,-.16,0);cyl(11.4,11.4,.35,graphite,0,5.6,0);
 mesh(new THREE.CylinderGeometry(10.95,10.95,4.95,96,1,true),glass,0,2.72,0);
 addArchitecture(scene);ring(10.75,.045,warm,.026);ring(7.45,.023,warm,.026);ring(3.3,.028,cyan,.026);
 let seed=47;const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const points=[];for(let i=0;i<2400;i++){const a=rand()*Math.PI*2,v=rand()*2-1,r=106+rand()*32;points.push(Math.cos(a)*Math.sqrt(1-v*v)*r,v*r,Math.sin(a)*Math.sqrt(1-v*v)*r);}
 const stars=new THREE.BufferGeometry();stars.setAttribute('position',new THREE.Float32BufferAttribute(points,3));scene.add(new THREE.Points(stars,new THREE.PointsMaterial({color:0xdceaff,size:.19})));
 const earthMat=std(0x447eb2,0,.9),earth=mesh(new THREE.SphereGeometry(14,48,32),earthMat,-18,9,-47);earth.rotation.z=.18;
 new THREE.TextureLoader().load(new URL('../../experiences/shared/world-surface.png',import.meta.url).href,t=>{t.colorSpace=THREE.SRGBColorSpace;earthMat.map=t;earthMat.color.set(0xffffff);earthMat.needsUpdate=true;},undefined,()=>{});
 mesh(new THREE.SphereGeometry(2.6,24,16),std(0xa7abb5,0,1),21,9,-57);
 const records=[],targets=[],obstacles=[];
 const depts=[{"id":"discover","name":"COMEDY CLUB","subtitle":"Global humor discovery","x":0,"z":0,"note":"Discover planned comedy categories; no live media is connected."},{"id":"standup","name":"STAND-UP","subtitle":"Comedy performances","x":-6.8,"z":-3.8,"note":"Explore the planned stand-up stage."},{"id":"sketch","name":"SKETCHES AND MEMES","subtitle":"Short-form humor","x":6.8,"z":-3.8,"note":"Explore planned independent sketches and humorous media."},{"id":"studio","name":"COMEDIAN STUDIO","subtitle":"Write a comedy concept","x":0,"z":6.4,"note":"Draft a local performance idea. Nothing is published."}];
 function sign(g,d,y=2.5){
 const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.fillStyle='#111b28';x.fillRect(0,0,1024,256);x.strokeStyle='#d7c4a2';x.lineWidth=4;x.strokeRect(6,6,1012,244);x.fillStyle='#eff5ff';x.textAlign='center';x.font='600 60px system-ui';x.fillText(d.name,512,105);x.fillStyle='#c7d8df';x.font='32px system-ui';x.fillText(d.subtitle,512,183);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return mesh(new THREE.PlaneGeometry(3.25,.81),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}),0,y,-.18,g);
 }
 function register(g,d,r){records.push(d);obstacles.push({x:d.x,z:d.z,r});g.traverse(o=>{if(o.isMesh){o.userData.department=d;targets.push(o);}});}
 function department(d){
 const g=new THREE.Group();g.position.set(d.x,0,d.z);g.rotation.y=Math.atan2(-d.x,-d.z);scene.add(g);addContactShade(scene,d.x,d.z,2.3);
 box(3.7,.18,1.9,graphite,0,.09,0,g);box(3.52,.07,1.74,platinum,0,.22,0,g);
 for(const s of [-1,1]){box(.27,3.15,.38,platinum,s*1.66,1.8,-.52,g);box(.045,2.8,.055,warm,s*1.66,1.8,-.3,g);}
 box(3.65,.24,.46,graphite,0,3.46,-.52,g);box(3.42,.045,.08,warm,0,3.31,-.25,g);sign(g,d);
 box(2.7,.73,.75,graphite,0,.61,.34,g);box(2.85,.12,.84,platinum,0,1.04,.34,g);box(2.15,.06,.57,bronze,0,1.13,.34,g);
 if(d.id==='studio'){const door=mesh(new THREE.CylinderGeometry(.36,.36,.10,48),platinum,0,1.61,-.02,g);door.rotation.x=Math.PI/2;const wheel=mesh(new THREE.TorusGeometry(.23,.03,10,40),bronze,0,1.61,.055,g);box(.36,.045,.05,bronze,0,1.61,.08,g);}
 if(d.id==='sketch'){const ball=mesh(new THREE.SphereGeometry(.31,28,18),earthMat,0,1.62,.26,g);}
 if(d.id==='standup'){const mat=new THREE.MeshBasicMaterial({color:0x95dfff,wireframe:true});mesh(new THREE.IcosahedronGeometry(.32,1),mat,0,1.61,.2,g);}
 register(g,d,2.02);
 }
 depts.slice(1).forEach(department);
 const hub=new THREE.Group();scene.add(hub);addContactShade(scene,0,0,2.9);
 cyl(2.25,2.45,.2,graphite,0,.1,0,hub);cyl(1.8,2.05,.7,platinum,0,.55,0,hub);cyl(1.95,1.95,.13,graphite,0,.965,0,hub);ring(1.89,.034,warm,1.05,hub);
 const symbol=mesh(new THREE.SphereGeometry(.75,40,28),earthMat,0,1.95,0,hub);ring(.93,.021,cyan,1.95,hub);sign(hub,depts[0],2.7);register(hub,depts[0],2.45);
 function show(d=null){
 body.replaceChildren();$('#panel-title').textContent=d?d.name:'1AGE';
 const make=(tag,content)=>{const e=document.createElement(tag);e.textContent=content;body.append(e);return e;};
 if(d){make('p',d.note);mountPanel(body,d.id);}
 else{for(const [n,url] of [['1AGE World','https://1age.world/'],['1AGE.com','https://1age.com/'],['1AGE Page','https://1age.page/']]){const a=make('a',n);a.href=url;}const select=make('select','');select.setAttribute('aria-label','Graphics resolution');for(const [n,v] of [['Low','0.8'],['Balanced','1.5'],['High','2']])select.add(new Option(n,v));select.value=String(quality);select.onchange=()=>{quality=Number(select.value);resize();};}
 walker.clear();if(!panel.open)panel.showModal();
 }
 panel.addEventListener('close',()=>walker.clear());
 addEventListener('pagehide',()=>{if(panel.open)panel.close();});
 const distance=d=>Math.hypot(camera.position.x-d.x,camera.position.z-d.z);
 function interact(d){if(!d||distance(d)>4.7){status.textContent='Walk closer to a department.';return;}status.textContent='';show(d);}
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();
 const walker=createWalker(camera,renderer.domElement,{radius:10.15,eyeHeight:1.75,spawn:[0,1.75,9.2],obstacles,paused:()=>panel.open,onTap:e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(targets,false)[0];if(hit)interact(hit.object.userData.department);}});
 $('#interact').onclick=()=>interact([...records].sort((a,b)=>distance(a)-distance(b))[0]);$('#menu').onclick=()=>show();$('#reset').onclick=()=>{walker.clear();walker.reset();status.textContent='';};
 addEventListener('keydown',e=>{if(e.code==='KeyE'&&!panel.open&&!e.repeat&&!e.target?.closest?.('input,textarea,select'))$('#interact').click();});
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,quality));renderer.setSize(innerWidth,innerHeight);}resize();addEventListener('resize',resize);
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);status.textContent='Graphics context lost. Reload or use the 1AGE menu.';});
 let last=performance.now();status.textContent='';renderer.setAnimationLoop(now=>{const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;walker.update(dt);earth.rotation.y+=dt*.025;symbol.rotation.y+=dt*.4;renderer.render(scene,camera);});
}catch(error){console.error(error);status.textContent='3D could not start. Return to 1AGE using the center logo.';$('#menu').onclick=()=>location.href='https://1age.com/';}
