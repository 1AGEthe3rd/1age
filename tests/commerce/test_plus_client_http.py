"""Real local HTTP round trip using the actual Plus client and mock backend."""
import shutil,subprocess,sys,tempfile,threading,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'services/checkout'))
from server import Handler,ThreadingHTTPServer
from core import Checkout
from accounts import Accounts

@unittest.skipUnless(shutil.which('node'),'Node required for Plus client integration')
class PlusClientHTTP(unittest.TestCase):
 def test_actual_client_and_backend_entitlement_lifecycle(self):
  root=Path(__file__).resolve().parents[2]
  with tempfile.TemporaryDirectory() as tmp:
   server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.checkout=Checkout(Path(tmp)/'test.sqlite3');server.accounts=Accounts(server.checkout);server.auth_lock=threading.Lock();server.auth_attempts=[];base=f'http://127.0.0.1:{server.server_port}';server.allowed_hosts={f'127.0.0.1:{server.server_port}'}
   thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
   script='''import assert from 'node:assert/strict';
import {createPlusTestClient} from './experiences/plus/test-client.mjs';
const client=createPlusTestClient((path,opts)=>fetch(new URL(path,process.argv[1]),opts));
assert.equal((await client.login('member-test','disposable-local-password',true)).active,false);
await client.create(true);assert.equal((await client.simulate('paid')).active,true);
assert.equal((await client.simulate('subscription_cancelled')).active,false);
assert.equal((await client.simulate('paid')).active,false);
assert.equal((await client.simulate('refunded')).active,false);
await client.logout();assert.equal(client.signedIn(),false);
console.log('Actual Plus client / local mock backend lifecycle passed.');'''
   try:
    result=subprocess.run(['node','--input-type=module','-e',script,base],cwd=root,capture_output=True,text=True,timeout=30)
    self.assertEqual(result.returncode,0,result.stderr)
   finally:server.shutdown();server.server_close();thread.join()
