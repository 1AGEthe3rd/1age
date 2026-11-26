import test from 'node:test';import assert from 'node:assert/strict';import {profiles,initialState,stepVehicle} from './vehicle-model.mjs';
const simulate=(p,input,n=100)=>{let s=initialState();for(let i=0;i<n;i++)s=stepVehicle(s,p,input,.02);return s;};
test('vehicle profiles differ in acceleration',()=>assert.notEqual(simulate(profiles[0],{throttle:1}).speed,simulate(profiles[1],{throttle:1}).speed));
test('brake slows forward movement',()=>{const p=profiles[0],s=simulate(p,{throttle:1});assert.ok(stepVehicle(s,p,{brake:1},.05).speed<s.speed);});
test('turning changes yaw',()=>assert.notEqual(simulate(profiles[1],{throttle:1,steer:1}).yaw,0));
test('stationary vehicle does not reverse or move under braking',()=>assert.deepEqual(stepVehicle(initialState(),profiles[0],{brake:1},.05),initialState()));
test('bounds prevent exiting track',()=>{const s={x:0,z:-33.99,yaw:0,speed:15,steering:0};assert.equal(stepVehicle(s,profiles[0],{throttle:1},.05).speed,0);});
