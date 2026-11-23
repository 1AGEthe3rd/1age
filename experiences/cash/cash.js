// Local-test-only account client. Session tokens stay in memory, never URLs or storage.
const $=s=>document.querySelector(s);let token=null,order=null,busy=false,nextOffset=null;
function message(text){$('#status').textContent=text;}
async function api(path,data){
 const r=await fetch('/api/cash/'+path,{method:data===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(data===undefined?{}:{body:JSON.stringify(data)}),signal:AbortSignal.timeout(8000)});
 if(!(r.headers.get('content-type')||'').includes('application/json'))throw Error('The local Cash backend is not running. This static preview cannot authenticate or issue credits.');
 const result=await r.json();if(!r.ok)throw Error(result.error||'Local test request failed');return result;
}
async function run(fn){if(busy)return;busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();}catch(e){message(e.message);}finally{busy=false;document.querySelectorAll('button').forEach(b=>b.disabled=false);updateOrder();}}
function updateOrder(){
 $('#order').hidden=!order;$('#create').disabled=!!order||busy;
 if(!order)return;$('#order-state').textContent='Test order '+order.id+' · '+order.state;
 for(const b of document.querySelectorAll('[data-state]'))b.disabled=busy||!(order.state==='pending'?['paid','failed','cancelled'].includes(b.dataset.state):order.state==='paid'&&b.dataset.state==='refunded');
}
async function account(append=false){
 const result=await api('account'+(append&&nextOffset!==null?'?offset='+nextOffset:''));
 $('#signin').hidden=true;$('#account').hidden=false;$('#handle').textContent='Test account: '+result.handle;$('#balance').textContent=(result.balance_minor/100).toFixed(2)+' test Cash';
 if(!append)$('#history').replaceChildren();
 for(const row of result.transactions){const li=document.createElement('li');li.textContent=(row.delta>0?'+':'')+(row.delta/100).toFixed(2)+' · '+row.reason+' · '+new Date(row.created*1000).toLocaleString()+(row.estimated?' (estimated legacy timestamp)':'');$('#history').append(li);}
 if(!append&&!result.transactions.length){const li=document.createElement('li');li.textContent='No transactions yet.';$('#history').append(li);}
 nextOffset=result.next_offset;$('#more').hidden=nextOffset===null;
}
$('#signin').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget),method=e.submitter?.value||'login';const data={handle:form.get('handle'),password:form.get('password')};e.currentTarget.elements.password.value='';run(async()=>{const result=await api(method,data);token=result.session_token;order=null;await account();message('Signed in to local test backend. Session lasts up to one hour.');});});
$('#refresh').addEventListener('click',()=>run(()=>account()));
$('#more').addEventListener('click',()=>run(()=>account(true)));
$('#logout').addEventListener('click',()=>run(async()=>{await api('logout',{});token=null;order=null;$('#account').hidden=true;$('#signin').hidden=false;$('#history').replaceChildren();$('#balance').textContent='';message('Signed out. The backend retains your test ledger.');}));
$('#create').addEventListener('click',()=>run(async()=>{order=await api('orders',{app:'cash',sku:'cash-demo',request_key:crypto.randomUUID(),consent_version:null});message('Test order pending. No credits have been issued.');}));
for(const button of document.querySelectorAll('[data-state]'))button.addEventListener('click',()=>run(async()=>{const result=await api('simulate',{order_id:order.id,order_token:order.access_token,state:button.dataset.state});order={...order,...result};await account();message('Simulated '+order.state+'. No real payment occurred.');}));
message('Connect the local test backend to use accounts. Never enter your normal account password here.');
