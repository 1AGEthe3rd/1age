// Tab-scoped demonstration recovery only; never store provider credentials here.
export function recoveryStore(storage, app) {
 const key='1age-checkout-demo-v2:'+app;
 return {
  read(){try{const r=JSON.parse(storage.getItem(key));return r?.version===2&&r.app===app&&typeof r.requestKey==='string'&&['backend','browser'].includes(r.mode)?r:null;}catch{return null;}},
  write(record){try{storage.setItem(key,JSON.stringify({...record,version:2,app}));return true;}catch{return false;}},
  clear(){try{storage.removeItem(key);}catch{}}
 };
}
