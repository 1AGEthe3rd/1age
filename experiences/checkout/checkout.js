import {recoveryStore} from './recovery.mjs';
const offers={
 store:{sku:'store-demo',label:'Showroom checkout demonstration',amount:0,currency:'USD',kind:'demo',terms:'No product, charge, tax, shipping or fulfillment. Nonfinancial demonstration.'},
 plus:{sku:'plus-demo',label:'1AGE Plus membership demonstration',amount:333,currency:'USD',kind:'subscription',terms:'Proposed $3.33 USD per month, recurring until cancelled. Demonstration only; no enrollment or billing.'},
 cash:{sku:'cash-demo',label:'1AGE Cash credit demonstration',amount:100,currency:'USD',kind:'credits',terms:'Demonstrates 1 internal Cash credit at a $1 accounting reference. No redemption, transfer or cash-out. Sales disabled pending review.'}
};
const $=s=>document.querySelector(s),select=$('#offer'),message=$('#status');
let storage;try{storage=sessionStorage;}catch{storage=null;}
let account;try{account=storage.getItem('1age-checkout-demo-account')||crypto.randomUUID().replaceAll('-','');storage.setItem('1age-checkout-demo-account',account);}catch{account=crypto.randomUUID().replaceAll('-','');}
let order=null,backend=false,busy=true,lastError='',requestKey=crypto.randomUUID(),saved=null;
const app=new URLSearchParams(location.search).get('app');select.value=Object.hasOwn(offers,app)?app:'store';
let recovery=recoveryStore(storage,select.value);
const states={pending:'Simulation pending. No payment has occurred.',paid:'Simulation succeeded. No real payment or entitlement was created.',failed:'Simulation failed. No payment was taken.',cancelled:'Checkout simulation cancelled. Nothing was charged.',refunded:'Simulated refund recorded. No real refund occurred.'};
async function api(path,data,token){const r=await fetch('/api/'+path,{method:data?'POST':'GET',signal:AbortSignal.timeout(8000),headers:{'Content-Type':'application/json','X-Demo-Account':account,...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('Local demonstration backend unavailable. Your order is retained; retry when connected.');const result=await r.json();if(!r.ok)throw Error(result.error||'Demonstration request failed');return result;}
function showError(e){lastError=e.name==='TimeoutError'?'The local demonstration backend timed out. Your order is retained; retry when connected.':e.message||'This demonstration could not complete. Try again.';}
function remember(){saved={mode:backend?'backend':'browser',requestKey,order,consent:$('#consent').checked};if(!recovery.write(saved))$('#mode').textContent+=' · Recovery unavailable in this browser';}
function render(){
 const app=select.value,item=order||offers[app];$('#order-label').textContent=item.label;$('#price').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(item.amount/100)+(app==='plus'?' / month':'');$('#terms').textContent=item.terms;$('#consent-wrap').hidden=app!=='plus';$('#consent').disabled=busy||!!order;$('#return-origin').href=app==='plus'?'../plus/':app==='cash'?'https://1age.cash/':'../store/';$('#return-origin').textContent='Return to '+(app==='plus'?'Plus':app==='cash'?'Cash':'Store');
 $('#order-detail').hidden=!order;$('#create-order').disabled=busy||!!order;select.disabled=busy||!!order||!!saved;$('#new-order').disabled=busy;$('#refresh-order').disabled=busy;
 if(!order){message.textContent=lastError||'Review the demonstration terms to begin.';return;}
 $('#state').textContent=order.state;message.textContent=order.membership==='cancelled'?'Demonstration membership cancelled. No real subscription existed.':states[order.state];if(order.refund_recovery?.status==='pending_review')message.textContent+=' Test credit recovery requires operator review; no further deduction has been made.';message.dataset.state=order.state;
 $('#download-receipt').hidden=!order.receipt;$('#download-receipt').disabled=busy;
 $('#receipt').textContent=['DEMONSTRATION ONLY',`Order: ${order.id}`,`Reference: ${order.receipt||'Not issued'}`,`State: ${order.state}`,`Membership: ${order.membership||'inactive'}`,`Test credit recovery: ${order.refund_recovery?.status||'not applicable'}`,`Demo Cash balance: ${(order.balance_minor||0)/100}`,`Adapter: ${backend?'local mock backend':'browser-only simulation'}`].join('\n');
 if(lastError)message.textContent=lastError;
 for(const b of document.querySelectorAll('[data-outcome]')){const next=b.dataset.outcome;b.disabled=busy||!(order.state==='pending'?['pending','paid','failed','cancelled'].includes(next):order.state==='paid'?(next==='refunded'||(next==='subscription_cancelled'&&app==='plus'&&order.membership==='active')):false);}
}
function simulateBrowser(state){
 order.state=state==='subscription_cancelled'?'paid':state;
 if(state==='paid'){order.receipt='DEMO-RECEIPT-'+order.id;if(select.value==='cash')order.balance_minor=100;if(select.value==='plus')order.membership='active';}
 if(state==='refunded'){order.balance_minor=0;order.membership='inactive';}
 if(state==='subscription_cancelled')order.membership='cancelled';
}
async function refresh(){if(backend&&order){const token=order.access_token;order={...await api('orders/'+encodeURIComponent(order.id),null,token),access_token:token};remember();}}
select.addEventListener('change',()=>{const url=new URL(location.href);url.searchParams.set('app',select.value);history.replaceState(null,'',url);recovery=recoveryStore(storage,select.value);initialize();});
$('#create-order').addEventListener('click',async()=>{
 if(select.value==='plus'&&!$('#consent').checked){message.textContent='Confirm the proposed recurring terms before starting this simulation.';$('#consent').focus();return;}
 lastError='';busy=true;remember();render();
 try{const item=offers[select.value];order=backend?await api('orders',{app:select.value,sku:item.sku,request_key:requestKey,consent_version:select.value==='plus'?'plus-demo-v3':null}):{...item,id:'browser-demo-'+crypto.randomUUID(),state:'pending',mode:'demonstration',provider:'mock',balance_minor:0,membership:'inactive',receipt:null};remember();}
 catch(e){showError(e);}finally{busy=false;render();}
});
for(const b of document.querySelectorAll('[data-outcome]'))b.addEventListener('click',async()=>{lastError='';busy=true;render();try{if(backend){const token=order.access_token;order={...await api('simulate',{order_id:order.id,state:b.dataset.outcome},token),access_token:token};}else simulateBrowser(b.dataset.outcome);remember();}catch(e){showError(e);}finally{busy=false;render();}});
$('#refresh-order').addEventListener('click',async()=>{busy=true;lastError='';render();try{await refresh();}catch(e){showError(e);}finally{busy=false;render();}});
$('#new-order').addEventListener('click',()=>{recovery.clear();saved=null;order=null;requestKey=crypto.randomUUID();lastError='';$('#consent').checked=false;render();});
$('#download-receipt').addEventListener('click',async()=>{
 busy=true;lastError='';render();try{
  let text=$('#receipt').textContent+'\nNo real money or products changed hands.';
  if(backend){const receipt=await api('orders/'+encodeURIComponent(order.id)+'/receipt',null,order.access_token);await refresh();text=['DEMONSTRATION ONLY',`Order: ${receipt.order_id}`,`Reference: ${receipt.reference}`,`State: ${receipt.state}`,`Item: ${receipt.label}`,`Amount: ${receipt.amount/100} ${receipt.currency}`,`Membership: ${receipt.membership}`,`Test credit recovery: ${receipt.refund_recovery?.status||'not applicable'}`,receipt.notice].join('\n');}
  const blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=order.id+'-demo-receipt.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
 }catch(e){showError(e);}finally{busy=false;render();}
});
async function initialize(){
 busy=true;lastError='';order=null;saved=recovery.read();requestKey=saved?.requestKey||crypto.randomUUID();$('#consent').checked=!!saved?.consent;render();
 try{
  const r=await fetch('/api/catalog',{signal:AbortSignal.timeout(8000)});
  if(r.status===404){backend=false;}else{if(!r.ok)throw Error('Local backend unavailable. Reload to retry; no new order was created.');const data=await r.json();if(data.mode!=='demonstration')throw Error('Unsupported checkout environment.');backend=true;}
  if(saved&&saved.mode!==(backend?'backend':'browser'))throw Error('The saved demonstration belongs to a different environment. Open the original preview to recover it.');
  $('#mode').textContent=backend?'Local mock backend · No real payments':'Browser-only simulation · No real payments';
  if(saved){order=saved.order;if(backend){if(order)await refresh();else{const item=offers[select.value];order=await api('orders',{app:select.value,sku:item.sku,request_key:requestKey,consent_version:saved.consent?'plus-demo-v3':null});remember();}}}
  busy=false;
 }catch(e){showError(e);$('#mode').textContent='Demonstration connection unavailable · Reload to retry';}
 render();
}
initialize();
