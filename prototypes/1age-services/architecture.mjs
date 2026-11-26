import * as THREE from '../../experiences/shared/vendor/three.module.js';

// Deterministic, locally generated textures: no external artwork or CDN.
function canvasTexture(size,paint){const c=document.createElement('canvas');c.width=c.height=size;const ctx=c.getContext('2d');paint(ctx,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function createFloorMaterial(){
 const t=canvasTexture(512,(ctx,s)=>{ctx.fillStyle='#46515b';ctx.fillRect(0,0,s,s);let seed=42;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);for(let i=0;i<9000;i++){const v=75+Math.floor(random()*45);ctx.fillStyle='rgba('+v+','+(v+5)+','+(v+9)+',.14)';ctx.fillRect(random()*s,random()*s,1+random()*3,1+random()*2);}ctx.strokeStyle='#252e37';ctx.lineWidth=3;ctx.strokeRect(1,1,s-2,s-2);ctx.strokeStyle='#8d9ba3';ctx.lineWidth=1;ctx.strokeRect(5,5,s-10,s-10);});
 t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(12,12);
 return new THREE.MeshStandardMaterial({map:t,color:0xb5c2cb,metalness:.18,roughness:.42});
}
export function addArchitecture(scene,{radius=10.95,bays=16}={}){
 const alloy=new THREE.MeshStandardMaterial({color:0xa7b5bf,metalness:.35,roughness:.32});
 const graphite=new THREE.MeshStandardMaterial({color:0x19232d,metalness:.3,roughness:.48});
 const white=new THREE.MeshStandardMaterial({color:0xe6e6df,roughness:.42,metalness:.12});
 const warm=new THREE.MeshBasicMaterial({color:0xffe7bc});
 const cyan=new THREE.MeshBasicMaterial({color:0x9cdbfa});
 const add=(geo,mat,x,y,z,rotation=0,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;};
 const box=(w,h,d,mat,x,y,z,rotation=0,parent=scene)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,rotation,parent);
 const ring=(r,t,mat,y)=>{const m=add(new THREE.TorusGeometry(r,t,8,96),mat,0,y,0);m.rotation.x=Math.PI/2;return m;};
 // Low raised window sill and layered ceiling fascia, outside walking bounds.
 ring(radius-.18,.09,alloy,.67);ring(radius-.17,.025,warm,.77);ring(radius-.18,.12,graphite,4.96);ring(radius-.24,.03,cyan,4.81);
 ring(8.05,.22,graphite,5.13);ring(7.84,.035,warm,4.95);ring(3.5,.17,alloy,5.17);ring(3.3,.028,warm,5.02);
 const chord=2*(radius-.12)*Math.sin(Math.PI/bays);
 for(let i=0;i<bays;i++){
  const angle=(i+.5)*Math.PI*2/bays, x=Math.cos(angle)*(radius-.12),z=Math.sin(angle)*(radius-.12),rot=Math.PI/2-angle;
  box(chord+.04,.56,.19,graphite,x,.35,z,rot);box(chord+.04,.14,.25,alloy,x,.69,z,rot);
  box(chord+.04,.48,.24,graphite,x,5.12,z,rot);
  const a=i*Math.PI*2/bays;
  // Radial ceiling beams and recessed linear lighting.
  const bx=Math.cos(a)*6.9,bz=Math.sin(a)*6.9;
  box(6.4,.20,.28,graphite,bx,5.21,bz,-a);box(5.8,.033,.055,warm,bx,5.09,bz,-a);
  const px=Math.cos(a)*10.76,pz=Math.sin(a)*10.76;
  box(.43,4.04,.30,alloy,px,2.76,pz,-a);box(.47,.09,.39,white,px,.84,pz,-a);
 }
 // Soft overhead luminaires, no shadow-map cost for mobile.
 for(let i=0;i<4;i++){const a=i*Math.PI/2;const l=new THREE.PointLight(0xffeed9,22,12,2);l.position.set(Math.cos(a)*5,4.85,Math.sin(a)*5);scene.add(l);}
 const centerLight=new THREE.PointLight(0xa5ddff,15,9,2);centerLight.position.set(0,4.5,0);scene.add(centerLight);
}
export function addContactShade(scene,x,z,radius=1.6){
 const tex=canvasTexture(128,(ctx,s)=>{const g=ctx.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(0,0,0,.48)');g.addColorStop(.65,'rgba(0,0,0,.20)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,s,s);});
 const m=new THREE.Mesh(new THREE.PlaneGeometry(radius*2,radius*2),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));m.rotation.x=-Math.PI/2;m.position.set(x,.025,z);scene.add(m);return m;
}
