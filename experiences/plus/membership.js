import {createPlusTestClient} from './test-client.mjs';
const client=createPlusTestClient(),$=id=>document.getElementById(id);let busy=false;
function controls(){const signed=client.signedIn();$('plus-test-signin').hidden=signed;$('plus-test-session').hidden=!signed;if(!signed){$('plus-test-events').hidden=true;$('plus-test-consent').checked=false;}}
async function run(action){if(busy)return;busy=true;const buttons=[...$('plus-test').querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);try{await action();}catch(e){$('plus-test-status').textContent=e.message;}finally{busy=false;buttons.forEach(b=>b.disabled=false);controls();}}
function status(result){$('plus-test-status').textContent=result.active?'Test Plus entitlement active. No real membership or billing.':'Test Plus entitlement inactive. Free exploration remains available.';}
$('plus-test-signin').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget,handle=form.elements.handle.value,password=form.elements.password.value,register=e.submitter?.value==='register';form.elements.password.value='';run(async()=>status(await client.login(handle,password,register)));});
$('plus-test-refresh').addEventListener('click',()=>run(async()=>status(await client.refresh())));
$('plus-test-create').addEventListener('click',()=>run(async()=>{await client.create($('plus-test-consent').checked);$('plus-test-events').hidden=false;$('plus-test-status').textContent='Mock order pending. No membership is activated until a simulated verified payment event.';}));
for(const b of $('plus-test-events').querySelectorAll('[data-plus-event]'))b.addEventListener('click',()=>run(async()=>status(await client.simulate(b.dataset.plusEvent))));
$('plus-test-logout').addEventListener('click',()=>run(async()=>{await client.logout();$('plus-test-status').textContent='Signed out of the local test service.';}));
controls();
