"""Read-only public DNS, registration and HTTPS inventory. No account or zone writes."""
import argparse,concurrent.futures,datetime,html,json,re,urllib.error,urllib.parse,urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
HEADERS={'User-Agent':'1AGE-public-domain-audit/1.0'}
TYPES={'A':1,'NS':2,'CNAME':5,'MX':15,'TXT':16,'AAAA':28,'CAA':257}
def fetch_json(url,accept='application/json'):
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={**HEADERS,'Accept':accept}),timeout=12) as r:return {'ok':True,'data':json.load(r)}
 except Exception as e:return {'ok':False,'error':type(e).__name__+': '+str(e)[:160]}
def registration(domain):
 result=fetch_json('https://rdap.org/domain/'+domain,'application/rdap+json')
 if not result['ok']:return result
 data=result['data'];names=[]
 for entity in data.get('entities',[]):
  if 'registrar' in entity.get('roles',[]):
   card=entity.get('vcardArray',[None,[]])
   names.extend(row[3] for row in card[1] if row[0]=='fn')
 return {'ok':True,'registrars':names,'nameservers':[n.get('ldhName') for n in data.get('nameservers',[])],'registrationStatus':data.get('status',[]),'source':'https://rdap.org/domain/'+domain}
def dns_query(domain,kind):
 url='https://cloudflare-dns.com/dns-query?'+urllib.parse.urlencode({'name':domain,'type':kind})
 r=fetch_json(url,'application/dns-json')
 if not r['ok']:return r
 data=r['data'];return {'ok':data.get('Status')==0,'rcode':data.get('Status'),'answers':[{'name':a.get('name'),'type':a.get('type'),'ttl':a.get('TTL'),'data':a.get('data')} for a in data.get('Answer',[])],'source':url}
def web(domain):
 url='https://'+domain+'/'
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=15) as r:
   content=r.read(262144).decode('utf-8','replace');title=re.search(r'<title[^>]*>(.*?)</title>',content,re.S|re.I)
   return {'ok':True,'httpStatus':r.status,'finalUrl':r.url,'server':r.headers.get('Server'),'title':html.unescape(re.sub('<[^>]+>','',title[1])).strip()[:200] if title else None,'3dSignals':[s for s in ['three.module','three.js','index.wasm','godot','virtual-entry','universe.js','story-scene'] if s in content.lower()],'browserVerified':False}
 except Exception as e:return {'ok':False,'error':type(e).__name__+': '+str(e)[:160],'browserVerified':False}
def audit(app):
 domain=app['domain'];dns={}
 for kind in TYPES:dns[kind]=dns_query(domain,kind)
 dns['www-CNAME']=dns_query('www.'+domain,'CNAME')
 return {**app,'ownershipVerified':False,'registration':registration(domain),'dns':dns,'https':web(domain),'changesApplied':False}
def run(out):
 out=Path(out)
 if out.exists():raise ValueError('Output exists; refusing to overwrite')
 apps=json.loads((ROOT/'data/app-domains.json').read_text())+[{'slug':'blog','name':'1AGE Blog','domain':'1age.blog','repository':'1age-blog'},{'slug':'world','name':'1AGE World','domain':'1age.world','repository':'1age-world-web'},{'slug':'search','name':'1AGE Search','domain':'1age.com','repository':'1age'}]
 with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(audit,apps))
 report={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'method':'Public recursive DNS via Cloudflare DoH, RDAP registry responses, HTTPS requests. Not authenticated zone inventories. No private contacts retained.','apps':results,'changesApplied':{'dns':False,'hosting':False,'production':False}}
 out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps({'domainsChecked':len(results),'httpsResponded':sum(a['https']['ok'] for a in results),'output':str(out),'changesApplied':False}))
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--out',required=True);run(p.parse_args().out)
