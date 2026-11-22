// Local test only. Tokens and order capabilities remain private, in memory.
export function createPlusTestClient(fetcher=fetch){
 let token=null,order=null,pendingKey=null;
 const clear=()=>{token=null;order=null;pendingKey=null;};
 async function request(path,data){
  const response=await fetcher(path,{method:data===undefined?'GET':'POST',credentials:'omit',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:AbortSignal.timeout(8000)});
  if(response.status===401||response.status===403){clear();throw Error('Test session expired or access denied. Sign in again.');}
  if(!response.ok)throw Error('Local test service unavailable or request rejected. No real payment occurred.');
  return response.json();
 }
 return {
  async login(handle,password,register=false){clear();const r=await request('/api/cash/'+(register?'register':'login'),{handle,password});if(r.mode!=='local-test'||typeof r.session_token!=='string')throw Error('Unexpected account response');token=r.session_token;return this.refresh();},
  async refresh(){if(!token)throw Error('Sign in to a disposable local test account.');const r=await request('/api/accounts/entitlements');if(r.mode!=='local-test'||r.provider!=='mock'||r.entitlements?.plus?.live_membership!==false)throw Error('Unsupported membership response');return {active:r.entitlements.plus.active===true,mode:'local-test'};},
  async create(consent){if(!token||consent!==true)throw Error('Sign in and accept the mock recurring terms first.');pendingKey??=crypto.randomUUID();order=await request('/api/cash/orders',{app:'plus',sku:'plus-demo',request_key:pendingKey,consent_version:'plus-demo-v1'});pendingKey=null;return {state:order.state};},
  async simulate(state){if(!token||!order||!['paid','subscription_cancelled','refunded'].includes(state))throw Error('Create a mock order first.');const r=await request('/api/cash/simulate',{order_id:order.id,order_token:order.access_token,state});return {state:r.state,...await this.refresh()};},
  async logout(){try{if(token)await request('/api/cash/logout',{});}finally{clear();}},
  signedIn:()=>Boolean(token)
 };
}
