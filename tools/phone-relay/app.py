"""Hosted relay: isolated sessions, browser-native controller, no native OS execution."""
import asyncio
from collections import deque, OrderedDict
import io,json,os,secrets,time
from pathlib import Path
from urllib.parse import urlsplit
from aiohttp import web,WSMsgType
import qrcode
from protocol import Session,ZERO

HERE=Path(__file__).resolve().parent

class Relay:
 def __init__(self,origin,allowed,capacity=100):
  self.origin=origin.rstrip('/')
  self.allowed=set(allowed)|{self.origin}
  self.capacity=capacity
  self.sessions={}
  self.rates=OrderedDict()
 def limit(self,key,maximum):
  now=time.monotonic()
  queue=self.rates.setdefault(key,deque())
  while queue and now-queue[0]>60:queue.popleft()
  if len(queue)>=maximum:raise web.HTTPTooManyRequests(text='Please wait a minute before trying again.')
  queue.append(now);self.rates.move_to_end(key)
  while len(self.rates)>4096:self.rates.popitem(last=False)
 def host(self,request):
  s=self.sessions.get(request.match_info['id'])
  supplied=request.headers.get('Authorization','')
  if not s or not secrets.compare_digest(supplied,'Bearer '+s.host_token):raise web.HTTPUnauthorized()
  return s
 @web.middleware
 async def guard(self,request,handler):
  if request.host!=urlsplit(self.origin).netloc:raise web.HTTPForbidden(text='Unknown host')
  source=request.headers.get('Origin')
  if source and source not in self.allowed:raise web.HTTPForbidden(text='Origin refused')
  if request.method=='OPTIONS':response=web.Response(status=204)
  else:
   try:response=await handler(request)
   except web.HTTPException as error:response=error
  if source in self.allowed:
   response.headers.update({'Access-Control-Allow-Origin':source,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'})
  response.headers.update({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()'})
  if isinstance(response,web.HTTPException):raise response
  return response
 async def create(self,request):
  self.limit(('create',request.remote),6)
  self.limit(('create-total',),120)
  if len(self.sessions)>=self.capacity:raise web.HTTPServiceUnavailable(text='Controller service is busy. Try again shortly.')
  s=Session()
  # PINs must be unique among pending, unexpired sessions.
  pins={v.pin for v in self.sessions.values() if v.pin}
  while s.pin in pins:s.pin=f'{secrets.randbelow(1000000):06d}'
  s.host_token=secrets.token_urlsafe(32)
  s.host_origin=request.headers.get('Origin',self.origin)
  self.sessions[s.id]=s
  return web.json_response({'id':s.id,'token':s.host_token,'pin':s.pin,'controllerUrl':self.origin+'/controller','expiresIn':120})
 async def pair(self,request):
  self.limit(('pair',request.remote),8)
  self.limit(('pair-total',),60)
  try:
   data=await request.json()
   if not isinstance(data,dict):raise ValueError('Invalid code')
   invitation=data.get('invite','');pin=data.get('pin','')
   if not isinstance(invitation,str) or not isinstance(pin,str):raise ValueError('Invalid code')
   s=next((v for v in self.sessions.values() if
      (bool(invitation) and secrets.compare_digest(invitation,v.invitation)) or
      (bool(pin) and secrets.compare_digest(pin,v.pin))),None)
   if s is None:raise ValueError('Invalid or expired code. Create a new code on the computer.')
   token=s.pair()
   return web.json_response({'id':s.id,'token':token,'expiresIn':1800})
  except (ValueError,TypeError):raise web.HTTPBadRequest(text='Invalid, expired or already used code. Create a new code on the computer.')
 async def qr(self,request):
  s=self.host(request)
  if not s.invitation or time.monotonic()>s.expires:raise web.HTTPGone()
  buffer=io.BytesIO()
  qrcode.make(self.origin+'/controller#invite='+s.invitation).save(buffer,format='PNG')
  return web.Response(body=buffer.getvalue(),content_type='image/png')
 async def close(self,s):
  self.sessions.pop(s.id,None)
  for ws in (s.host,s.phone):
   if ws is not None:await ws.close(code=1000,message=b'Session ended')
 async def revoke(self,request):
  await self.close(self.host(request));return web.Response(status=204)
 async def socket(self,request):
  self.limit(('socket',request.remote),60)
  if request.headers.get('Origin') not in self.allowed:raise web.HTTPForbidden(text='WebSocket origin required')
  ws=web.WebSocketResponse(heartbeat=10,max_msg_size=4096)
  await ws.prepare(request)
  session=None;role=None
  try:
   data=await asyncio.wait_for(ws.receive_json(),5)
   if not isinstance(data,dict):raise ValueError()
   session=self.sessions.get(data.get('id'))
   role=data.get('role');token=data.get('token')
   if session is None or role not in ('host','phone') or not isinstance(token,str):raise ValueError()
   expected=session.host_token if role=='host' else session.phone_token
   if not expected or not secrets.compare_digest(token,expected) or getattr(session,role) is not None:raise ValueError()
   if role=='host' and request.headers.get('Origin')!=session.host_origin:raise ValueError()
   if role=='phone' and (time.monotonic()>session.active_until or request.headers.get('Origin')!=self.origin):raise ValueError()
   setattr(session,role,ws)
   await ws.send_json({'type':'ready'})
   async for message in ws:
    if self.sessions.get(session.id) is not session:break
    if message.type==WSMsgType.TEXT:
     data=json.loads(message.data)
     if role=='phone':
      if time.monotonic()>session.active_until:break
      session.input(data)
     else:
      if not isinstance(data,dict) or type(data.get('ack')) is not int:raise ValueError()
      while session.events and session.events[0]['id']<=data['ack']:session.events.popleft()
    elif message.type==WSMsgType.ERROR:break
  except (ValueError,TypeError,AttributeError,asyncio.TimeoutError):
   await ws.close(code=1008,message=b'Invalid or expired session')
  finally:
   if session is not None and role in ('host','phone') and getattr(session,role) is ws:
    setattr(session,role,None)
    session.state=dict(ZERO);session.events.clear()
    if role=='host':await self.close(session)
  return ws
 async def tick(self,app):
  async def run():
   while True:
    now=time.monotonic()
    for s in list(self.sessions.values()):
     if (s.phone_token and now>s.active_until) or (not s.phone_token and now>s.expires) or (s.host is None and now-s.created>15):
      await self.close(s);continue
     if s.host is not None and not s.host.closed:
      try:await asyncio.wait_for(s.host.send_json(s.sample()),.15)
      except (ConnectionError,RuntimeError,asyncio.TimeoutError):await self.close(s)
    await asyncio.sleep(1/30)
  task=asyncio.create_task(run());yield;task.cancel()
  try:await task
  except asyncio.CancelledError:pass
  for s in list(self.sessions.values()):await self.close(s)
 async def options(self,request):return web.Response(status=204)
 async def page(self,request):return web.FileResponse(HERE/'static/controller.html')
 async def health(self,request):return web.json_response({'ok':True,'build':'006'})
 def app(self):
  app=web.Application(middlewares=[self.guard],client_max_size=4096)
  app.router.add_get('/healthz',self.health)
  app.router.add_get('/',self.page);app.router.add_get('/controller',self.page)
  app.router.add_static('/static',HERE/'static',show_index=False)
  app.router.add_post('/api/session',self.create)
  app.router.add_post('/api/pair',self.pair)
  app.router.add_get('/api/session/{id}/qr',self.qr)
  app.router.add_delete('/api/session/{id}',self.revoke)
  app.router.add_get('/ws',self.socket)
  app.router.add_route('OPTIONS','/{tail:.*}',self.options)
  app.cleanup_ctx.append(self.tick);return app

def main():
 origin=os.environ.get('PUBLIC_ORIGIN','').rstrip('/')
 parsed=urlsplit(origin)
 if parsed.scheme!='https' or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username:
  raise SystemExit('Set PUBLIC_ORIGIN to the HTTPS origin of this relay.')
 allowed=os.environ.get('ALLOWED_ORIGINS','https://northleftchef.com,https://www.northleftchef.com').split(',')
 relay=Relay(origin,[v.strip().rstrip('/') for v in allowed])
 web.run_app(relay.app(),host='0.0.0.0',port=int(os.environ.get('PORT','8080')),access_log=None)
if __name__=='__main__':main()
