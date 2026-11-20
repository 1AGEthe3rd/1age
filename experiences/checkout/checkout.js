const offers={
 store:{sku:'store-demo',label:'Showroom checkout demonstration',amount:0,currency:'USD',kind:'demo',terms:'No product, charge, tax, shipping or fulfillment. Nonfinancial demonstration.'},
 plus:{sku:'plus-demo',label:'1AGE Plus membership demonstration',amount:100,currency:'USD',kind:'subscription',terms:'Proposed $1 USD per month, recurring until cancelled. Demonstration only; no enrollment or billing.'},
 cash:{sku:'cash-demo',label:'1AGE Cash credit demonstration',amount:100,currency:'USD',kind:'credits',terms:'Demonstrates 1 internal Cash credit at a $1 accounting reference. No redemption, transfer or cash-out. Sales disabled pending review.'}
};
const $=s=>document.querySelector(s),select=$('#offer'),message=$('#status');
let order=null,backend=false,busy=false,lastError='',requestKey=crypto.randomUUID();
let account;try{account=sessionStorage.getItem('1age-checkout-demo-account')||crypto.randomUUID().replaceAll('-','');sessionStorage.setItem('1age-checkout-demo-account',account);}catch{account=crypto.randomUUID().replaceAll('-','');}
const states={pending:'Simulation pending. No payment has occurred.',paid:'Simulation succeeded. No real payment or entitlement was created.',failed:'Simulation failed. No payment was taken.',cancelled:'Checkout simulation cancelled. Nothing was charged.',refunded:'Simulated refund recorded. No real refund occurred.'};
async function api(path,data,token){const r=await fetch('/api/'+path,{method:data?'POST':'GET',headers:{'Content-Type':'application/json','X-Demo-Account':account,...(token?{Authorization:'Bearer '+token}:{})},...(data?{body:JSON.stringify(data)}:{})});const result=await r.json();if(!r.ok)throw Error(result.error||'Demonstration request failed');return result;}
function showError(e){lastError=e.message||'This demonstration could not complete. Try again.';message.textContent=lastError;}
function render(){
 const app=select.value,item=order||offers[app];$('#order-label').textContent=item.label;$('#price').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(item.amount/100)+(app==='plus'?' / month':'');$('#terms').textContent=item.terms;$('#consent-wrap').hidden=app!=='plus';$('#return-origin').href=app==='plus'?'../plus/':app==='cash'?'https://1age.cash/':'../store/';$('#return-origin').textContent='Return to '+(app==='plus'?'Plus':app==='cash'?'Cash':'Store');
 $('#order-detail').hidden=!order;$('#create-order').disabled=busy||!!order;select.disabled=busy||!!order;
 if(!order){if(lastError)message.textContent=lastError;return;}
 $('#state').textContent=order.state;message.textContent=order.membership==='cancelled'?'Demonstration membership cancelled. No real subscription existed.':states[order.state];message.dataset.state=order.state;
 $('#download-receipt').hidden=!order.receipt;
 $('#receipt').textContent=['DEMONSTRATION ONLY',`Order: ${order.id}`,`Reference: ${order.receipt||'Not issued'}`,`State: ${order.state}`,`Membership: ${order.membership||'inactive'}`,`Demo Cash balance: ${(order.balance_minor||0)/100}`,`Adapter: ${backend?'local mock backend':'browser-only simulation'}`].join('\n');
 if(lastError)message.textContent=lastError;
 for(const b of document.querySelectorAll('[data-outcome]')){const next=b.dataset.outcome;b.disabled=busy||!(order.state==='pending'?['pending','paid','failed','cancelled'].includes(next):order.state==='paid'?(next==='refunded'||(next==='subscription_cancelled'&&app==='plus'&&order.membership==='active')):false);}
}
function simulateBrowser(state){
 order.state=state==='subscription_cancelled'?'paid':state;
 if(state==='paid'){order.receipt='DEMO-RECEIPT-'+order.id;if(select.value==='cash')order.balance_minor=100;if(select.value==='plus')order.membership='active';}
 if(state==='refunded'){order.balance_minor=0;order.membership='inactive';}
 if(state==='subscription_cancelled')order.membership='cancelled';
 return order;
}
select.addEventListener('change',()=>{order=null;lastError='';requestKey=crypto.randomUUID();$('#consent').checked=false;message.textContent='Review the demonstration terms to begin.';render();});
$('#create-order').addEventListener('click',async()=>{
 if(select.value==='plus'&&!$('#consent').checked){message.textContent='Confirm the proposed recurring terms before starting this simulation.';$('#consent').focus();return;}
 lastError='';busy=true;render();
 try{const item=offers[select.value];order=backend?await api('orders',{app:select.value,sku:item.sku,request_key:requestKey,consent_version:select.value==='plus'?'plus-demo-v1':null}):{...item,id:'browser-demo-'+crypto.randomUUID(),state:'pending',mode:'demonstration',provider:'mock',balance_minor:0,membership:'inactive',receipt:null};}
 catch(e){showError(e);}finally{busy=false;render();}
});
for(const b of document.querySelectorAll('[data-outcome]'))b.addEventListener('click',async()=>{lastError='';busy=true;render();try{if(backend){const token=order.access_token;order={...await api('simulate',{order_id:order.id,state:b.dataset.outcome},token),access_token:token};}else simulateBrowser(b.dataset.outcome);}catch(e){showError(e);}finally{busy=false;render();}});
$('#download-receipt').addEventListener('click',()=>{const blob=new Blob([$('#receipt').textContent+'\nNo real money or products changed hands.'],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=order.id+'-demo-receipt.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});
const app=new URLSearchParams(location.search).get('app');select.value=Object.hasOwn(offers,app)?app:'store';render();
fetch('/api/catalog').then(r=>r.ok?r.json():Promise.reject()).then(data=>{if(data.mode!=='demonstration')throw Error();backend=true;$('#mode').textContent='Local mock backend · No real payments';}).catch(()=>{$('#mode').textContent='Browser-only simulation · No real payments';});
