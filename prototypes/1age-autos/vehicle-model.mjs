// Fictional engineering profiles for a sandbox, never manufacturer specifications.
export const profiles=Object.freeze([
 Object.freeze({id:'compact-rhd',name:'Compact import · RHD',drive:'FWD',side:'right',mass:1120,power:82,wheelbase:2.45,steer:.53,brake:7.2,grip:.85,maxSpeed:42}),
 Object.freeze({id:'coupe-rhd',name:'Performance coupe · RHD',drive:'RWD',side:'right',mass:1460,power:210,wheelbase:2.62,steer:.46,brake:9.1,grip:1.0,maxSpeed:58}),
 Object.freeze({id:'utility-lhd',name:'Utility vehicle · LHD',drive:'AWD',side:'left',mass:2100,power:155,wheelbase:2.95,steer:.42,brake:6.6,grip:.8,maxSpeed:40})
]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function initialState(){return {x:0,z:12,yaw:0,speed:0,steering:0};}
export function stepVehicle(s,p,input,dt){
 dt=clamp(Number.isFinite(dt)?dt:0,0,.05);
 const throttle=clamp(input.throttle||0,0,1),brake=clamp(input.brake||0,0,1),steer=clamp(input.steer||0,-1,1);
 const target=steer*p.steer/(1+Math.abs(s.speed)*.055);
 const steering=s.steering+(target-s.steering)*Math.min(1,dt*7);
 const traction=p.grip*9.81*(p.drive==='AWD'?.82:p.drive==='RWD'?.68:.60);
 const drive=Math.min(traction,p.power*1000/(p.mass*Math.max(3,s.speed)));
 const speed=clamp(s.speed+(throttle*drive*(1-brake)-brake*p.brake-.18-.0025*s.speed*s.speed)*dt,0,p.maxSpeed);
 const yaw=s.yaw-speed/p.wheelbase*Math.tan(steering)*dt;
 const x=s.x-Math.sin(yaw)*speed*dt,z=s.z-Math.cos(yaw)*speed*dt;
 if(Math.hypot(x,z)>34)return {...s,speed:0,steering};
 return {x,z,yaw,speed,steering};
}
