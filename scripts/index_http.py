"""Bounded public HTTP access with conditional JSON caching and redirect validation."""
import hashlib
import ipaddress
import json
import os
import socket
import time
import urllib.error
import urllib.request
from urllib.parse import urlsplit
from urllib.robotparser import RobotFileParser
from indexlib import https_url

UA='1AGEIndexer/1.0 (+https://1age.com/; public metadata catalog)'

class PublicRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,req,fp,code,msg,headers,newurl):
        public_url(newurl)
        if req.has_header('Authorization') and urlsplit(req.full_url).hostname != urlsplit(newurl).hostname:
            raise ValueError('Refusing credential-bearing cross-host redirect')
        return super().redirect_request(req,fp,code,msg,headers,newurl)

def public_url(url):
    https_url(url)
    try:
        addresses=socket.getaddrinfo(urlsplit(url).hostname,443,type=socket.SOCK_STREAM)
    except socket.gaierror:
        # Managed outbound proxies may resolve remotely. Only fixed public-source
        # hosts have this fallback; arbitrary catalog URLs remain uncheckable.
        if urlsplit(url).hostname in {'api.github.com','chainid.network','github.com','api.llama.fi'}: return url
        raise
    if not addresses or any(not ipaddress.ip_address(addr[4][0]).is_global for addr in addresses):
        raise ValueError('Destination does not resolve exclusively to public addresses')
    return url

class PublicHTTP:
    def __init__(self,limits,cache_dir):
        self.limits=limits;self.cache_dir=cache_dir;cache_dir.mkdir(parents=True,exist_ok=True)
        self.opener=urllib.request.build_opener(PublicRedirect())
        self.last_request=0;self.requests=0;self.bytes=0;self.cache_hits=0;self.robots={}
        self.started=time.monotonic()
    def request(self,url,method='GET',headers=None,max_bytes=None):
        public_url(url)
        if time.monotonic()-self.started>600: raise TimeoutError('Run network time budget exceeded')
        delay=self.limits['min_request_interval_seconds']-(time.monotonic()-self.last_request)
        if delay>0: time.sleep(delay)
        self.last_request=time.monotonic(); self.requests+=1
        req=urllib.request.Request(url,method=method,headers={'User-Agent':UA,**(headers or {})})
        with self.opener.open(req,timeout=self.limits['timeout_seconds']) as response:
            cap=max_bytes or self.limits['max_response_bytes']
            body=response.read(cap+1) if method!='HEAD' else b''
            if len(body)>cap: raise ValueError('Response exceeds byte budget')
            self.bytes+=len(body)
            return response.status,dict(response.headers),body,response.url
    def json(self,url):
        # Only configured public JSON/API endpoints may use this cache.
        path=self.cache_dir/(hashlib.sha256(url.encode()).hexdigest()+'.json')
        try: cached=json.loads(path.read_text()) if path.exists() else None
        except (ValueError,OSError): cached=None
        headers={'Accept':'application/json'}
        token=os.environ.get('GH_API_TOKEN')
        if token and urlsplit(url).hostname=='api.github.com': headers['Authorization']='Bearer '+token
        if cached and cached.get('etag'): headers['If-None-Match']=cached['etag']
        for attempt in range(self.limits['retries']+1):
            try:
                _,response_headers,body,_=self.request(url,headers=headers)
                data=json.loads(body)
                stored={'url':url,'etag':next((v for k,v in response_headers.items() if k.lower()=='etag'),None),'data':data}
                path.write_text(json.dumps(stored))
                return data,False
            except urllib.error.HTTPError as error:
                if error.code==304 and cached and 'data' in cached:
                    self.cache_hits+=1;return cached['data'],True
                # Respect rate/auth restrictions; do not retry or change routes.
                if error.code not in (500,502,503,504) or attempt==self.limits['retries']: raise
            except (urllib.error.URLError,TimeoutError,ConnectionError):
                if attempt==self.limits['retries']: raise
            time.sleep(1+attempt)
        raise RuntimeError('Source retrieval failed')
    def text(self,url):
        if self.robot_allowed(url) is not True:raise ValueError('Public hub retrieval not permitted by available robots policy')
        _,_,body,_=self.request(url,headers={'Accept':'text/html'},max_bytes=2000000)
        return body.decode('utf-8'),False
    def robot_allowed(self,url):
        origin='https://'+urlsplit(url).netloc
        if origin not in self.robots:
            try:
                _,_,body,_=self.request(origin+'/robots.txt',max_bytes=128000)
                parser=RobotFileParser();parser.parse(body.decode('utf-8',errors='replace').splitlines())
                self.robots[origin]=parser
            except urllib.error.HTTPError as error:
                self.robots[origin]=True if error.code==404 else None
            except Exception:
                self.robots[origin]=None
        policy=self.robots[origin]
        return policy if isinstance(policy,bool) or policy is None else policy.can_fetch(UA,url)
    def check_link(self,url):
        allowed=self.robot_allowed(url)
        if allowed is not True: return {'status':'robots_unavailable' if allowed is None else 'robots_disallowed'}
        try:
            code,_,_,final=self.request(url,'HEAD')
            return {'status':'ok' if final==url else 'redirected','http_status':code,'final_url':final}
        except urllib.error.HTTPError as error:
            # HEAD-unsupported is inconclusive; do not download full sites to probe further.
            return {'status':'possibly_broken' if error.code in (404,410) else 'restricted' if error.code in (401,403,429) else 'unreachable','http_status':error.code}
        except Exception as error:
            return {'status':'unreachable','error':type(error).__name__}
