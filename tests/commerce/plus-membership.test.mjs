import assert from 'node:assert/strict';
import {createPlusTestClient} from '../../experiences/plus/test-client.mjs';
const calls=[];let active=false,denied=false,failLogout=false;
const fake=async(url,options)=>{calls.push({url,options});let data={};if(denied)return {status:403,ok:false};
 if(url.endsWith('/login')||url.endsWith('/register'))data={mode:'local-test',session_token:'private-test-session'};
 else if(url.endsWith('/entitlements'))data={mode:'local-test',provider:'mock',entitlements:{plus:{active,live_membership:false}}};
 else if(url.endsWith('/orders'))data={id:'test-order',access_token:'private-order-capability',state:'pending'};
 else if(url.endsWith('/simulate')){active=JSON.parse(options.body).state==='paid';data={state:active?'paid':'refunded'};}
 else if(url.endsWith('/logout')){if(failLogout)throw Error('offline');data={signed_out:true};}
 return {ok:true,status:200,json:async()=>data};};
const client=createPlusTestClient(fake);
await assert.rejects(()=>client.create(true));assert.equal((await client.login('test-user','disposable-password')).active,false);
await assert.rejects(()=>client.create(false));await client.create(true);assert.equal((await client.simulate('paid')).active,true);assert.equal((await client.simulate('subscription_cancelled')).active,false);
assert.equal(calls.filter(c=>c.url.endsWith('/orders')).length,1);
for(const call of calls){assert(!call.url.includes('private-'));assert.equal(call.options.credentials,'omit');}
assert.equal(calls.find(c=>c.url.endsWith('/entitlements')).options.headers.Authorization,'Bearer private-test-session');
denied=true;await assert.rejects(()=>client.refresh());assert.equal(client.signedIn(),false);denied=false;
await client.login('test-user','disposable-password');failLogout=true;await assert.rejects(()=>client.logout());assert.equal(client.signedIn(),false);
console.log('Plus client passed: consent, authenticated status, mock transitions, header-only capabilities, revoked-session and logout cleanup.');

let attempts=0;const keys=[];const retry=createPlusTestClient(async(url,opts)=>{if(url.endsWith('/orders')){keys.push(JSON.parse(opts.body).request_key);if(attempts++===0)throw Error('connection lost');}return fake(url,opts);});
failLogout=false;await retry.login('test-user','disposable-password');await assert.rejects(()=>retry.create(true));await retry.create(true);assert.equal(keys[0],keys[1]);console.log('Uncertain order creation retries preserve idempotency key.');
