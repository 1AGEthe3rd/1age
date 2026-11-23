import shutil,subprocess,sys,tempfile,threading,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from server import Handler,ThreadingHTTPServer
from core import Checkout
from accounts import Accounts
from page_identity import PageIdentity
@unittest.skipUnless(shutil.which('node'),'Node required')
class PageClientHTTP(unittest.TestCase):
 def test_profile_privacy_and_guest_lookup_using_actual_client(self):
  root=Path(__file__).resolve().parents[2]
  with tempfile.TemporaryDirectory() as tmp:
   server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.checkout=Checkout(Path(tmp)/'test.sqlite3');server.accounts=Accounts(server.checkout);server.page_identity=PageIdentity(server.accounts,{'page':'http://127.0.0.1:4191/callback'});server.auth_lock=threading.Lock();server.auth_attempts=[];base=f'http://127.0.0.1:{server.server_port}';server.allowed_hosts={f'127.0.0.1:{server.server_port}'}
   thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
   script='''import assert from 'node:assert/strict';
import {createPageClient} from './experiences/page/client.mjs';
const requests=[];const transport=(url,options)=>{requests.push({url,options});return fetch(new URL(url,process.argv[1]),options);};
const owner=createPageClient(transport),guest=createPageClient(transport);
const initial=await owner.login('profile-test','disposable-local-password',true);assert.equal(initial.discoverable,false);
await assert.rejects(()=>guest.publicProfile('profile-test'));
const data={display_name:'Page Builder',bio:'My test profile',discoverable:true};await owner.save(data);
const found=await guest.publicProfile('profile-test');assert.equal(found.display_name,'Page Builder');assert(!('balance_minor' in found));assert(!('wallet' in found));
await assert.rejects(()=>owner.save({...data,wallet:'not accepted'}));
await owner.save({...data,discoverable:false});await assert.rejects(()=>guest.publicProfile('profile-test'));
for(const r of requests){assert.equal(r.options.credentials,'omit');assert(!r.url.includes('session_token'));if(r.url.startsWith('/api/page/public'))assert(!r.options.headers.Authorization);}
await owner.logout();assert.equal(owner.signedIn(),false);assert.throws(()=>owner.profile());
'''
   try:
    result=subprocess.run(['node','--input-type=module','-e',script,base],cwd=root,capture_output=True,text=True,timeout=30);self.assertEqual(result.returncode,0,result.stderr)
   finally:server.shutdown();server.server_close();thread.join()
