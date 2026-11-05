"""Shared static catalog validation/building. Never fetches or publishes."""
import collections
import copy
import datetime as dt
import hashlib
import ipaddress
import json
import re
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANUAL = ('data/1age-index.json', 'data/entities.json', 'data/blockchain-seeds.json')
FIELDS = ('name','id','domain','aliases','identifiers','networks','type','category','tags','description')

def read(path, default=None):
    return json.loads(path.read_text()) if path.exists() else copy.deepcopy(default)

def dump(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n'

def https_url(value):
    if not isinstance(value, str) or len(value) > 2048 or any(ord(c) < 32 for c in value):
        raise ValueError('Invalid destination URL')
    u = urlsplit(value)
    if u.scheme != 'https' or not u.hostname or u.username or u.password or u.port not in (None, 443):
        raise ValueError('Expected a credential-free HTTPS URL')
    host = u.hostname.lower()
    if '.' not in host or host.endswith(('.local','.localhost','.internal','.test','.invalid')):
        raise ValueError('Expected a public destination domain')
    try:
        ipaddress.ip_address(host)
    except ValueError:
        pass
    else:
        raise ValueError('IP literal destinations are not admitted')
    return value

def canonical(value):
    https_url(value)
    u = urlsplit(value)
    query = [(k,v) for k,v in parse_qsl(u.query,keep_blank_values=True) if not k.lower().startswith('utm_')]
    return urlunsplit(('https',u.hostname.lower().removeprefix('www.'),u.path.rstrip('/'),urlencode(query),''))

def validate(item, automatic=False):
    if not isinstance(item,dict): raise ValueError('Record must be an object')
    for key, limit in [('id',180),('name',160),('description',1000),('type',80),('category',80)]:
        if not isinstance(item.get(key),str) or not item[key].strip() or len(item[key])>limit:
            raise ValueError(f'Invalid {key}')
    https_url(item.get('official_links',{}).get('website'))
    for key in ('networks','aliases','identifiers','tags','quality_flags'):
        if key in item and (not isinstance(item[key],list) or len(item[key])>40 or
                            any(not isinstance(x,str) or len(x)>180 for x in item[key])):
            raise ValueError(f'Invalid {key}')
    review=item.get('source_review')
    if review:
        dt.date.fromisoformat(review['checked_on'])
        if review.get('status') != 'source_checked' or not isinstance(review.get('evidence'),list) or not review['evidence']:
            raise ValueError('Missing source evidence')
        for url in review['evidence']: https_url(url)
    for source in item.get('provenance',[]):
        https_url(source['url'])
        if not source.get('attribution'): raise ValueError('Missing attribution')
        if source.get('terms_url'): https_url(source['terms_url'])
    if automatic:
        if item.get('verification_status')!='unverified' or item.get('authenticity') or item.get('source_review'):
            raise ValueError('Automatic imports cannot assign verification or human source checks')
        if not item.get('source_id') or not item.get('provenance'): raise ValueError('Missing source provenance')
        for key in ('discovered_at','updated_at','last_seen_at'):
            dt.datetime.fromisoformat(item[key].replace('Z','+00:00'))
    return item

def merged_catalog(root=ROOT, automatic=None, health=None):
    overrides=read(root/'data/search-overrides.json',{})
    exclusions=read(root/'data/index-exclusions.json',{'ids':[],'urls':[]})
    suppressed_urls={canonical(url) for url in exclusions['urls']}
    suppressed_ids=set(exclusions['ids'])
    auto=read(root/'data/discovered-records.json',[]) if automatic is None else automatic
    # An ID removal also suppresses the same destination under a second source ID.
    originals=[item for source in MANUAL for item in read(root/source,[])]+auto
    for item in originals:
        if item.get('id') in suppressed_ids:
            suppressed_urls.add(canonical(item['official_links']['website']))
    records=[]; by_id={}; by_url={}; identifiers={}; duplicates=[]
    def insert(original,auto=False):
        item=copy.deepcopy(original)
        if not auto: item.update(overrides.get(item['id'],{}))
        validate(item,auto)
        url=canonical(item['official_links']['website'])
        if item['id'] in suppressed_ids or url in suppressed_urls: return
        item.setdefault('networks',[]);item.setdefault('aliases',[]);item.setdefault('identifiers',[])
        item['domain']=urlsplit(url).hostname
        prior=by_id.get(item['id']) or by_url.get(url)
        if prior:
            if canonical(prior['official_links']['website'])!=url: raise ValueError('Conflicting ID destinations')
            if not auto: raise ValueError('Duplicate manual catalog entry')
            duplicates.append({'id':item['id'],'merged_into':prior['id'],'url':url})
            # Curated content/verification wins; only union attributable identifiers, aliases, networks.
            for key in ('networks','aliases','identifiers','provenance'):
                for value in item.get(key,[]):
                    if value not in prior.setdefault(key,[]): prior[key].append(value)
            return
        for identifier in item['identifiers']:
            # Network namespace is required for addresses; never infer cross-chain identity.
            key=(tuple(sorted(item['networks'])), identifier)
            if key in identifiers and identifiers[key]!=url: raise ValueError('Conflicting public identifier')
            identifiers[key]=url
        by_id[item['id']]=item;by_url[url]=item;records.append(item)
    for source in MANUAL:
        for item in read(root/source,[]): insert(item)
    for item in auto: insert(item,True)
    health=read(root/'data/link-health.json',{}) if health is None else health
    seen_identifiers={}
    for item in records:
        item.setdefault('verification_status','unverified')
        item.setdefault('discovered_at',None);item.setdefault('updated_at',None)
        current_health=health.get(canonical(item['official_links']['website']))
        if current_health: item['link_health']=current_health
        flags=set(item.get('quality_flags',[])) - {'repeated_link_failure'}
        if current_health and current_health.get('consecutive_failures',0)>=2: flags.add('repeated_link_failure')
        if flags: item['quality_flags']=sorted(flags)
        else: item.pop('quality_flags',None)
        for identifier in item['identifiers']:
            key=(tuple(sorted(item['networks'])),identifier)
            url=canonical(item['official_links']['website'])
            if key in seen_identifiers and seen_identifiers[key]!=url: raise ValueError('Conflicting public identifier')
            seen_identifiers[key]=url
        validate(item)
    return sorted(records,key=lambda x:x['id']),duplicates

def outputs(records,root=ROOT):
    if not records: raise ValueError('An empty catalog cannot be published')
    content=dump(records)
    if len(content.encode())>600000: raise ValueError('Index exceeds the initial 600 KB budget')
    network_counts=collections.Counter(n for x in records for n in x['networks'])
    groups=collections.defaultdict(list)
    for item in records: groups[item.get('source_id','core')].append(item)
    files={'data/search-index.json':content};shards=[]
    for key,items in sorted(groups.items()):
        payload=dump(items)
        digest=hashlib.sha256(payload.encode()).hexdigest()
        slug=re.sub('[^a-z0-9-]','-',key.lower())
        filename=f'data/search-shards/{slug}-{digest[:16]}.json'
        files[filename]=payload
        values=[]
        for item in items:
            for field in FIELDS:
                value=item.get(field,'')
                values.extend(value if isinstance(value,list) else [str(value)])
        # Whitespace-word dedup preserves the browser engine's own punctuation tokenizer.
        routing=' '.join(sorted(set(' '.join(values).lower().split())))
        shards.append({'id':key,'url':'/'+filename,'records':len(items),'sha256':digest,'routing_text':routing})
    manifest={'schema_version':2,'records':len(records),'networks':dict(sorted(network_counts.items())),
              'sources':list(MANUAL)+['data/discovered-records.json'],
              'source_checked':sum('source_review' in x for x in records),'shards':shards}
    files['data/search-manifest.json']=dump(manifest)
    return files

def write_outputs(files,root=ROOT):
    for name,content in files.items():
        target=root/name;target.parent.mkdir(parents=True,exist_ok=True)
        temp=target.with_suffix(target.suffix+'.tmp');temp.write_text(content);temp.replace(target)
