import * as THREE from '../../experiences/shared/vendor/three.module.js';
import {subscribeInput} from '../../experiences/shared/gamepad.mjs';
import {profiles,initialState,stepVehicle} from './vehicle-model.mjs';
const $=s=>document.querySelector(s),p=profiles.find(v=>v.id===new URL(location.href).searchParams.get('vehicle'))||profiles[0];
$('#profile').textContent=p.name;
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;$('#scene').append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x07101a);scene.add(new THREE.HemisphereLight(0xd6eaff,0x52606b,2));const sun=new THREE.DirectionalLight(0xffe7c5,2.2);sun.position.set(-15,25,12);scene.add(sun);
const camera=new THREE.PerspectiveCamera(68,1,.05,220);
const mat=(color,metalness=.15,roughness=.5)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const road=mat(0x303b45),line=new THREE.MeshBasicMaterial({color:0xcbd5df}),rim=new THREE.MeshBasicMaterial({color:0x82dfff}),metal=mat(0x3e789d,.55,.29),rubber=mat(0x101317,0,.9),glass=new THREE.MeshPhysicalMaterial({color:0x8abbd5,transparent:true,opacity:.23,roughness:.18,depthWrite:false,side:THREE.DoubleSide}),interior=mat(0x161e28);
function mesh(g,m,x,y,z,parent=scene){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
const box=(w,h,d,m,x,y,z,parent=scene)=>mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
const disk=mesh(new THREE.CylinderGeometry(36,36,.4,96),road,0,-.2,0);for(const r of [9,22,34]){const ring=mesh(new THREE.TorusGeometry(r,.055,8,96),r===34?rim:line,0,.02,0);ring.rotation.x=Math.PI/2;}
for(let i=0;i<48;i++){const a=i*Math.PI*2/48;box(.12,.22,.12,rim,35*Math.cos(a),.15,35*Math.sin(a));}
const earth=mesh(new THREE.SphereGeometry(14,48,32),mat(0x487eb1),-47,20,-68);new THREE.TextureLoader().load(new URL('../../experiences/shared/world-surface.png',import.meta.url).href,t=>{t.colorSpace=THREE.SRGBColorSpace;earth.material.map=t;earth.material.color.set(0xffffff);earth.material.needsUpdate=true;});
const car=new THREE.Group();scene.add(car);const length=p.wheelbase+1.45,width=p.id==='utility-lhd'?1.94:1.78,height=p.id==='utility-lhd'?1.69:1.35;
box(width,.47,length,metal,0,.52,0,car);box(width*.92,.14,length*.26,metal,0,.82,-length*.35,car);
box(width*.86,.13,length*.48,metal,0,height, .18,car);box(width*.9,height-.82,.08,glass,0,(height+.82)/2,-length*.15,car);box(width*.9,height-.82,.08,glass,0,(height+.82)/2,length*.34,car);
for(const side of [-1,1])box(.075,height-.82,length*.48,glass,side*width*.44,(height+.82)/2,.18,car);
box(width*.86,.19,.36,interior,0,.89,-length*.13,car);
const wheelX=p.side==='right'?.38:-.38;
for(const x of [-.38,.38]){box(.43,.3,.48,interior,x,.8,.25,car);box(.43,.47,.16,interior,x,1.06,.49,car);}
mesh(new THREE.TorusGeometry(.16,.032,8,24),rubber,wheelX,1.03,-.31,car);
const wheels=[];for(const x of [-width*.51,width*.51])for(const z of [-p.wheelbase/2,p.wheelbase/2]){const pivot=new THREE.Group();pivot.position.set(x,.33,z);car.add(pivot);const w=mesh(new THREE.CylinderGeometry(.33,.33,.24,24),rubber,0,0,0,pivot);w.rotation.z=Math.PI/2;wheels.push({pivot,w,front:z<0});}
for(const x of [-width*.32,width*.32]){box(.38,.12,.06,line,x,.62,-length*.5,car);box(.36,.12,.06,new THREE.MeshBasicMaterial({color:0xff4343}),x,.62,length*.5,car);}
let state=initialState(),view=0,pad={move:{x:0,y:0}},keys=new Set();subscribeInput(i=>{pad=i;});
const clear=()=>{keys.clear();pad={move:{x:0,y:0}};state={...state,speed:0};};
addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);addEventListener('keydown',e=>{if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&!e.target?.closest('button,a')){e.preventDefault();keys.add(e.code);}if(e.code==='KeyC'&&!e.repeat)cycle();});addEventListener('keyup',e=>keys.delete(e.code));
function cycle(){view=(view+1)%3;$('#camera').setAttribute('aria-label',['Chase camera; cycle view','Driver camera; cycle view','Hood camera; cycle view'][view]);}$('#camera').onclick=cycle;$('#reset').onclick=()=>{clear();state=initialState();};
function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
const held=(a,b)=>Number(keys.has(a)||keys.has(b));let last=performance.now();renderer.setAnimationLoop(now=>{let dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(!document.hidden&&document.hasFocus())state=stepVehicle(state,p,{throttle:Math.max(held('KeyW','ArrowUp'),-pad.move.y),brake:Math.max(held('KeyS','ArrowDown'),Number(keys.has('Space')),pad.move.y),steer:pad.move.x+held('KeyD','ArrowRight')-held('KeyA','ArrowLeft')},dt);car.position.set(state.x,0,state.z);car.rotation.y=state.yaw;car.updateMatrixWorld(true);
for(const {pivot,w,front} of wheels){pivot.rotation.y=front?-state.steering:0;w.rotation.x-=state.speed*dt/.33;}
const driverHeight=p.id==='utility-lhd'?1.38:1.14;const eye=view===0?new THREE.Vector3(0,3.2,6.6):view===1?new THREE.Vector3(wheelX,driverHeight,.12):new THREE.Vector3(0,.97,-length*.25);
camera.position.copy(car.localToWorld(eye));camera.lookAt(car.localToWorld(new THREE.Vector3(view===1?wheelX:0,view===0?.7:driverHeight,-12)));earth.rotation.y+=dt*.018;$('#speed').textContent=Math.round(state.speed*3.6)+' km/h';renderer.render(scene,camera);});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();clear();renderer.setAnimationLoop(null);$('#status').textContent='Graphics unavailable; return to showroom.';});
