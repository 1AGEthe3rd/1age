import asyncio
import importlib.util
import math
from pathlib import Path
import unittest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer

spec=importlib.util.spec_from_file_location('oneage_phone',Path(__file__).resolve().parents[1]/'controller/server.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class InputTests(unittest.TestCase):
 def test_invalid_and_bounded(self):
  for state in [None,{}, {'move':[math.nan,0],'look':[0,0]}, {'move':[0,0],'look':[0,0],'buttons':{'Hack':True}}]:
   with self.assertRaises(ValueError): module.clean_state(state)
  result=module.clean_state({'move':[8,8],'look':[0,0],'buttons':{'A':True}})
  self.assertAlmostEqual(math.hypot(*result['move']),1)
 def test_expiry_and_single_use(self):
  session=module.Session();session.expires=0
  with self.assertRaises(ValueError):session.pair()
  session=module.Session();session.pair()
  with self.assertRaises(ValueError):session.pair()
 def test_text_validation_and_dedup(self):
  s=module.Session();s.text_input({'text':'Hello café 🌙','id':'first'})
  s.text_input({'text':'Hello café 🌙','id':'first'})
  self.assertEqual(len(s.events),1);self.assertEqual(s.events[0]['type'],'text')
  for data in [{'text':'x'*1001,'id':'bad'},{'text':'','id':'bad'}, {'text':'hi','id':None}]:
   with self.assertRaises(ValueError):s.text_input(data)
 def test_watchdog(self):
  s=module.Session();s.pair();s.phone=object();s.input({'move':[1,0],'look':[0,.5],'buttons':{'X':True}})
  self.assertTrue(s.sample()['connected']);self.assertEqual(len(s.sample()['events']),1)
  s.last_input-=1
  self.assertFalse(s.sample()['connected']);self.assertEqual(s.sample()['state'],module.ZERO)

class IntegrationTests(unittest.IsolatedAsyncioTestCase):
 async def asyncSetUp(self):
  self.server=module.ControllerServer('http://127.0.0.1',Path(__file__).resolve().parents[1]/'controller/nlc-snapshot')
  self.client=TestClient(TestServer(self.server.app()));await self.client.start_server()
  self.server.origin=str(self.client.make_url('')).rstrip('/');self.server.hosts={self.client.make_url('').host+':'+str(self.client.make_url('').port)}
  self.auth={'Authorization':'Bearer '+self.server.admin}
 async def asyncTearDown(self):await self.client.close()
 async def session(self):
  r=await self.client.post('/api/session',headers=self.auth);self.assertEqual(r.status,200);return await r.json()
 async def test_security_pairing_and_qr(self):
  self.assertEqual((await self.client.post('/api/session')).status,401)
  self.assertEqual((await self.client.post('/api/session',headers={**self.auth,'Origin':'https://evil.example'})).status,403)
  self.assertEqual((await self.client.get('/',headers={'Host':'evil.example'})).status,403)
  session=await self.session()
  r=await self.client.get('/api/qr',headers=self.auth);self.assertEqual(r.status,200);self.assertTrue((await r.read()).startswith(b'\x89PNG'))
  r=await self.client.post('/api/pair',json={'pin':session['pin']});self.assertEqual(r.status,200)
  self.assertEqual((await self.client.post('/api/pair',json={'pin':session['pin']})).status,400)
 async def test_rate_limit(self):
  await self.session()
  for _ in range(8):await self.client.post('/api/pair',json={'pin':'invalid'})
  self.assertEqual((await self.client.post('/api/pair',json={'pin':'invalid'})).status,429)
 async def test_websocket_input_release_and_revoke(self):
  s=await self.session()
  creds=await (await self.client.post('/api/pair',json={'invite':s['qrUrl'].split('invite=')[1]})).json()
  host=await self.client.ws_connect('/ws');await host.send_json({'id':s['id'],'role':'host','token':self.server.admin});self.assertEqual((await host.receive_json())['type'],'ready')
  phone=await self.client.ws_connect('/ws');await phone.send_json({'id':s['id'],'role':'phone','token':creds['token']});await phone.receive_json()
  await phone.send_json({'move':[.8,0],'look':[.3,-.2],'buttons':{'X':True}})
  for _ in range(10):
   data=await asyncio.wait_for(host.receive_json(),2)
   if data.get('connected') and data['events']:break
  self.assertEqual(data['state']['move'],[.8,0]);self.assertEqual(data['events'][0]['button'],'X')
  await host.send_json({'ack':data['events'][0]['id']})
  await phone.close()
  for _ in range(10):
   data=await asyncio.wait_for(host.receive_json(),2)
   if not data.get('connected'):break
  self.assertEqual(data['state'],module.ZERO)
  await host.close()
  self.assertEqual(self.server.session.active_until,0)
 async def test_text_over_websocket(self):
  s=await self.session()
  creds=await (await self.client.post('/api/pair',json={'pin':s['pin']})).json()
  host=await self.client.ws_connect('/ws');await host.send_json({'id':s['id'],'role':'host','token':self.server.admin});await host.receive_json()
  phone=await self.client.ws_connect('/ws');await phone.send_json({'id':s['id'],'role':'phone','token':creds['token']});await phone.receive_json()
  await phone.send_json({'move':[0,0],'look':[0,0],'buttons':{}})
  text={'type':'text','text':'Hello café 🌙','id':'test-text'}
  await phone.send_json(text);await phone.send_json(text)
  for _ in range(10):
   data=await asyncio.wait_for(host.receive_json(),2)
   if data.get('events'):break
  self.assertEqual(len(data['events']),1);self.assertEqual(data['events'][0]['text'],'Hello café 🌙')
  await phone.close();await host.close()
 async def test_expired_invitation(self):
  s=await self.session();self.server.session.expires=0
  self.assertEqual((await self.client.post('/api/pair',json={'pin':s['pin']})).status,400)
 async def test_native_delivery_and_session_scoped_ack(self):
  await self.session();session=self.server.session;session.pair()
  class Process:
   def poll(self):return None
  self.server.native_process=Process()
  session.phone=object()
  session.input({'move':[.5,0],'look':[0,.7],'buttons':{'X':True}})
  r=await self.client.get('/api/native/state?ack=999&session=wrong',headers=self.auth);data=await r.json()
  self.assertTrue(data['connected']);self.assertEqual(data['events'][0]['button'],'X')
  await self.client.get('/api/native/state?ack=999&session='+session.id,headers=self.auth)
  self.assertFalse(session.events)
  session.phone=None;self.server.native_process=None
 async def test_cafe_adapter_and_native_guard(self):
  r=await self.client.get('/cafe/');html=await r.text();self.assertIn('window.OneAGEPhone?.sample()',html)
  self.assertIn('remote.look[0]',html);self.assertIn('nlcInteractNow();',html)
  self.assertEqual((await self.client.post('/api/native/open')).status,401)
  self.assertEqual((await self.client.post('/api/native/open',headers=self.auth)).status,409)
  self.assertEqual((await self.client.get('/cafe/vendor/three.module.js')).status,200)

if __name__=='__main__':unittest.main()
