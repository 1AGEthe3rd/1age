import {subscribeInput} from './gamepad.mjs';
import * as THREE from './vendor/three.module.js';
// Shared, dependency-pinned viewer. All initial geometry is original demonstration content.
export function createViewer(host,{model='brand',showroom=false}={}){
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}
 catch{host.querySelector('.fallback-note').textContent='2D view · Interactive 3D is unavailable on this device.';return {setModel(){},async loadGLTF(){},dispose(){}};}
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 renderer.setPixelRatio(Math.min(devicePixelRatio,(navigator.hardwareConcurrency||4)<=4?1:1.5));
 renderer.setClearColor(0x020504);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
 host.append(renderer.domElement);host.classList.add('render-ready');
 const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x020504,12,35);
 const camera=new THREE.PerspectiveCamera(38,1,.1,60);let yaw=.3,pitch=.16,distance=8,targetDistance=8,active=true,auto=!reduced,object;
 const ambient=new THREE.HemisphereLight(0xe2ffdc,0x062015,2.8);scene.add(ambient);
 const key=new THREE.DirectionalLight(0xffffff,4);key.position.set(3,5,4);scene.add(key);
 const green=new THREE.PointLight(0x1bfd9c,35,16);green.position.set(-3,2,3);scene.add(green);
 const metal=new THREE.MeshStandardMaterial({color:0x101e18,metalness:.75,roughness:.25});
 const glow=new THREE.MeshBasicMaterial({color:0x1bfd9c,toneMapped:false});
 const white=new THREE.MeshStandardMaterial({color:0xe2ffdc,metalness:.35,roughness:.25});
 const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(1.8,2,.45,48),metal);pedestal.position.y=-1.7;scene.add(pedestal);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.83,.025,8,64),glow);ring.rotation.x=Math.PI/2;ring.position.y=-1.47;scene.add(ring);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(45,45),new THREE.MeshStandardMaterial({color:0x06100b,metalness:.8,roughness:.24}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.94;scene.add(floor);
 for(let i=0;i<5;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(3+i*2,.012,4,64),new THREE.MeshBasicMaterial({color:0x144b32}));r.rotation.x=Math.PI/2;r.position.y=-1.93;scene.add(r);}
 if(showroom){const terminal=new THREE.Group();box(terminal,3,-.6,.8,.65,1.4,.4);box(terminal,3,-.45,1.02,.48,.65,.03,glow);scene.add(terminal);for(const x of [-6,6])for(const z of [-5,1]){const pillar=new THREE.Mesh(new THREE.BoxGeometry(.12,7,.12),glow);pillar.position.set(x,1,z);scene.add(pillar);}const back=new THREE.Mesh(new THREE.PlaneGeometry(20,10),metal);back.position.set(0,2,-8);scene.add(back);}
 function box(group,x,y,z,w,h,d,material=metal){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);group.add(mesh);return mesh;}
 function polygon(group,points,material=white){const shape=new THREE.Shape();points.forEach(([x,y],i)=>shape[i?'lineTo':'moveTo']((x-687)/250,(535-y)/250));shape.closePath();group.add(new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.16,bevelEnabled:true,bevelSize:.018,bevelThickness:.02,bevelSegments:1,steps:1}),material));}
 function setModel(kind){
  if(object){scene.remove(object);object.traverse(n=>n.geometry?.dispose());}
  object=new THREE.Group();
  if(kind==='brand'){
   for(const [x,y,w,h] of [[408,490,435,45],[278,584,321,47],[644,584,287,47],[644,681,199,47],[644,774,303,46]])box(object,(x+w/2-687)/250,(535-y-h/2)/250,0,w/250,h/250,.16,white);
   polygon(object,[[408,680],[599,680],[599,820],[552,820],[552,727],[408,727]]);
   polygon(object,[[725,251],[1096,633],[1062,666],[692,284]]);
   polygon(object,[[570,364],[570,384],[594,384],[594,442],[573,448],[573,467],[669,468],[669,448],[649,442],[649,337],[621,335],[596,354],[573,363]],glow);
  }else if(kind==='quest'){
   const gate=new THREE.Mesh(new THREE.TorusGeometry(1.35,.1,12,64),glow);gate.position.set(0,.35,-.7);object.add(gate);
   for(let i=0;i<6;i++){const a=i*.95;const node=new THREE.Mesh(new THREE.DodecahedronGeometry(.22+i*.025,0),i===5?glow:white);node.position.set(Math.sin(a)*1.7,-.95+i*.32,Math.cos(a)*1.2);object.add(node);}
   const horizon=new THREE.Mesh(new THREE.TorusGeometry(2.4,.025,8,64),glow);horizon.rotation.x=Math.PI/2;horizon.position.y=-1.2;object.add(horizon);
  }else if(kind==='design'){
   box(object,0,-.65,0,3.1,.16,1.8,metal);for(const x of [-1.3,1.3])for(const z of [-.65,.65])box(object,x,-1.1,z,.1,.8,.1,white);
   const study=new THREE.Mesh(new THREE.IcosahedronGeometry(.8,1),new THREE.MeshStandardMaterial({color:0x1bfd9c,wireframe:true,emissive:0x1bfd9c,emissiveIntensity:.4}));study.position.y=.35;object.add(study);
   for(const x of [-1.5,1.5]){const guide=new THREE.Mesh(new THREE.TorusGeometry(.5,.025,8,40),glow);guide.position.set(x,.3,0);object.add(guide);}
  }else if(kind==='shop'){
   for(const x of [-1.4,0,1.4]){box(object,x,-.9,0,1,.16,1.2,white);box(object,x,.15,-.55,.06,2,.06,glow);box(object,x+.85,.15,-.55,.06,2,.06,glow);box(object,x+.42,1.15,-.55,.9,.06,.06,glow);}
  }else if(kind==='app'){
   object.add(new THREE.Mesh(new THREE.IcosahedronGeometry(.65,1),glow));for(let i=0;i<6;i++){const a=i*Math.PI/3;const portal=new THREE.Mesh(new THREE.TorusGeometry(.3,.055,8,32),white);portal.position.set(Math.sin(a)*1.6,Math.cos(a)*1.4,0);object.add(portal);}
  }else if(kind==='pocket'){
   box(object,0,0,0,1.8,2.65,.24);box(object,0,.18,.14,1.55,1.9,.02,new THREE.MeshStandardMaterial({color:0x071b10,emissive:0x06311c}));
   for(const x of [-.55,.55]){const joy=new THREE.Mesh(new THREE.TorusGeometry(.21,.03,8,32),glow);joy.position.set(x,-.9,.17);object.add(joy);}
   box(object,0,.25,.18,.8,.07,.04,glow);box(object,0,.05,.18,1.1,.06,.04,glow);
  }else if(kind==='property'){
   box(object,0,-.25,0,2.8,1.8,1.3);box(object,0,.7,0,3,.1,1.45,glow);
   for(const x of [-.9,0,.9])box(object,x,-.2,.67,.6,1,.03,new THREE.MeshStandardMaterial({color:0x123c2b,metalness:.7,roughness:.1}));
   box(object,0,-1.2,0,3.7,.12,2.2,white);
  }else if(kind==='terminal'){
   const body=box(object,0,0,0,1.9,2.4,.35);body.rotation.x=-.12;
   box(object,0,.2,.24,1.6,1.6,.04,new THREE.MeshStandardMaterial({color:0x052615,emissive:0x052615}));
   box(object,0,-.9,.27,1,.12,.06,glow);for(let i=0;i<3;i++)box(object,0,.7-i*.35,.3,1.1,.055,.03,glow);
  }else{object.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.4,1),new THREE.MeshStandardMaterial({color:0x073c25,wireframe:true,emissive:0x1bfd9c,emissiveIntensity:.6})));}
  object.position.y=.2;scene.add(object);draw();
 }
 let frame=0,last=0,disposed=false;
 const unpad=subscribeInput((input,dt)=>{const x=input.move.x+input.look.x;if(!x&&!input.move.y&&!input.look.y)return;auto=false;yaw-=x*dt*1.8;pitch=Math.max(-.3,Math.min(.9,pitch-input.look.y*dt));targetDistance=Math.max(4,Math.min(13,targetDistance+input.move.y*dt*3));draw();});
 function draw(){if(disposed)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;if(renderer.domElement.width!==Math.floor(w*renderer.getPixelRatio())||renderer.domElement.height!==Math.floor(h*renderer.getPixelRatio()))renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();distance=reduced?targetDistance:distance+(targetDistance-distance)*.2;camera.position.set(Math.sin(yaw)*distance,Math.sin(pitch)*distance+1,Math.cos(yaw)*distance);camera.lookAt(0,-.1,0);renderer.render(scene,camera);}
 function tick(t){frame=requestAnimationFrame(tick);if(!active||document.hidden||t-last<33)return;last=t;if(auto){yaw+=.002;object.position.y=.2+Math.sin(t*.0007)*.055;}draw();}
 function action(name){auto=false;if(name==='left')yaw-=.3;if(name==='right')yaw+=.3;if(name==='in')targetDistance=Math.max(4,targetDistance-.6);if(name==='out')targetDistance=Math.min(13,targetDistance+.6);if(name==='front'){yaw=0;pitch=.05;}if(name==='angle'){yaw=.7;pitch=.4;}if(name==='reset'){yaw=.3;pitch=.16;targetDistance=8;auto=!reduced;}draw();}
 const buttons=host.closest('.scene').querySelectorAll('[data-view]');const handlers=new Map();buttons.forEach(b=>{const fn=()=>action(b.dataset.view);handlers.set(b,fn);b.addEventListener('click',fn);});
 const keyHandler=e=>{const map={ArrowLeft:'left',ArrowRight:'right','+':'in','=':'in','-':'out',Home:'reset'};if(map[e.key]){e.preventDefault();action(map[e.key]);}};host.addEventListener('keydown',keyHandler);
 let pointer=null;
 const canvas=renderer.domElement;
 canvas.addEventListener('pointerdown',e=>{if(e.button===0)pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,drag:false};});
 canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.startX,dy=e.clientY-pointer.startY;if(!pointer.drag){if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;if(e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)){pointer=null;return;}pointer.drag=true;canvas.setPointerCapture(e.pointerId);}auto=false;yaw-=(e.clientX-pointer.x)*.01;pitch=Math.max(-.3,Math.min(.9,pitch+(e.clientY-pointer.y)*.005));pointer.x=e.clientX;pointer.y=e.clientY;draw();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,()=>{pointer=null;});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();host.classList.remove('render-ready');host.querySelector('.fallback-note').textContent='3D paused. The 2D view and controls remain available.';active=false;});
 const observer=new ResizeObserver(draw);observer.observe(host);const visibility=new IntersectionObserver(es=>{active=es[0].isIntersecting;});visibility.observe(host);
 setModel(model);if(!reduced)frame=requestAnimationFrame(tick);
 async function loadGLTF(src){
  const url=new URL(src,location.href);if(url.origin!==location.origin)throw Error('Only packaged media is permitted');
  const {GLTFLoader}=await import('./vendor/GLTFLoader.js');
  const gltf=await new GLTFLoader().loadAsync(url.href);
  if(disposed){gltf.scene.traverse(n=>{n.geometry?.dispose();n.material?.dispose();});return;}
  if(object){scene.remove(object);object.traverse(n=>n.geometry?.dispose());}
  object=gltf.scene;const bounds=new THREE.Box3().setFromObject(object),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const scale=2.7/Math.max(size.x,size.y,size.z,.001);object.scale.setScalar(scale);object.position.copy(center.multiplyScalar(-scale));object.position.y+=.2;scene.add(object);draw();
 }
 return {setModel,loadGLTF,action,dispose(){unpad();disposed=true;cancelAnimationFrame(frame);for(const [b,fn] of handlers)b.removeEventListener('click',fn);host.removeEventListener('keydown',keyHandler);renderer.domElement.remove();host.classList.remove('render-ready');observer.disconnect();visibility.disconnect();scene.traverse(n=>{n.geometry?.dispose();if(n.material&&!Array.isArray(n.material))n.material.dispose();});renderer.dispose();}};
}
