// Explicit user-action provider access. No signing, transfers, balance RPC or persistence.
export function createWalletView(providers,onChange=()=>{}){
 let snapshot=null,cleanup=()=>{},version=0;
 const emit=()=>{onChange(snapshot?{...snapshot}:null);};
 function clear(){version++;cleanup();cleanup=()=>{};snapshot=null;emit();}
 function watch(provider,event,fn){if(typeof provider.on==='function'&&typeof provider.removeListener==='function'){provider.on(event,fn);return ()=>provider.removeListener(event,fn);}return ()=>{};}
 function evmAddress(value){if(typeof value!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(value))throw Error('Wallet returned an invalid EVM account.');return value;}
 function solAddress(value){const text=value?.toString();if(typeof text!=='string'||!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(text))throw Error('Wallet returned an invalid Solana public key.');return text;}
 return {clear,current:()=>snapshot?{...snapshot}:null,async connect(kind){
  clear();const run=version;
  try{if(kind==='evm'){
   const p=providers.evm;if(!p||typeof p.request!=='function')throw Error('No injected EVM wallet detected.');
   const removes=[watch(p,'accountsChanged',()=>clear()),watch(p,'chainChanged',()=>clear()),watch(p,'disconnect',()=>clear())];cleanup=()=>removes.forEach(fn=>fn());
   const accounts=await p.request({method:'eth_requestAccounts'});if(run!==version)return;
   const address=evmAddress(accounts?.[0]),chain=await p.request({method:'eth_chainId'});if(run!==version)return;
   if(typeof chain!=='string'||!/^0x[0-9a-f]+$/i.test(chain))throw Error('Invalid chain response.');snapshot={kind:'evm',address,chain};
  }else if(kind==='solana'){
   const p=providers.solana;if(!p||typeof p.connect!=='function')throw Error('No supported injected Solana wallet detected.');
   const removes=[watch(p,'accountChanged',()=>clear()),watch(p,'disconnect',()=>clear())];cleanup=()=>removes.forEach(fn=>fn());
   const r=await p.connect();if(run!==version)return;snapshot={kind:'solana',address:solAddress(r?.publicKey),chain:'Cluster not verified'};
  }else throw Error('Unsupported wallet family.');emit();return this.current();
  }catch(e){if(run===version)clear();throw Error(e?.code===4001?'Wallet connection declined. No transaction was requested.':e?.message||'Wallet connection failed.');}
 }};
}
