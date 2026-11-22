import assert from 'node:assert/strict';import {createWalletView} from '../../experiences/exchange/wallets.mjs';
const calls=[],handlers=new Map(),address='0x'+'a'.repeat(40);const provider={async request({method}){calls.push(method);return method==='eth_requestAccounts'?[address]:'0x1';},on(event,fn){handlers.set(event,fn)},removeListener(event,fn){if(handlers.get(event)===fn)handlers.delete(event)}};
const changed=[];const view=createWalletView({evm:provider},state=>changed.push(state));assert.equal(calls.length,0);await view.connect('evm');assert.equal(view.current().address,address);assert.deepEqual(calls,['eth_requestAccounts','eth_chainId']);
handlers.get('accountsChanged')([]);assert.equal(view.current(),null);assert.equal(handlers.size,0);
await view.connect('evm');handlers.get('chainChanged')('0x2');assert.equal(view.current(),null);
const bad=createWalletView({evm:{request:async()=>{throw {code:4001}}}});await assert.rejects(()=>bad.connect('evm'),/declined/);assert.equal(bad.current(),null);
await assert.rejects(()=>createWalletView({}).connect('evm'),/detected/);
const sol=createWalletView({solana:{connect:async()=>({publicKey:{toString:()=> '1'.repeat(32)}})}});await sol.connect('solana');assert.equal(sol.current().chain,'Cluster not verified');sol.clear();assert.equal(sol.current(),null);
let resolve;const pending=createWalletView({evm:{request:()=>new Promise(r=>resolve=r)}});const request=pending.connect('evm');pending.clear();resolve([address]);await request;assert.equal(pending.current(),null);
assert(calls.every(method=>['eth_requestAccounts','eth_chainId'].includes(method)));console.log('Exchange wallet checks passed: explicit requests only, decline/missing providers, account/chain cleanup, listener removal and discarded stale connections.');

const raceHandlers=new Map();const raced=createWalletView({evm:{on:(e,f)=>raceHandlers.set(e,f),removeListener:(e)=>raceHandlers.delete(e),request:async({method})=>{if(method==='eth_requestAccounts')return [address];raceHandlers.get('chainChanged')('0x2');return '0x1';}}});await raced.connect('evm');assert.equal(raced.current(),null);assert.equal(raceHandlers.size,0);console.log('Network change during pending connection is discarded.');
