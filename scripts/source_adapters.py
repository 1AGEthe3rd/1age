"""Explicitly configured sources only. Metadata is unverified; no personal identity inference."""
import re
from indexlib import https_url,canonical

SUSPICIOUS=re.compile(r'\b(seed phrase|private key|guaranteed profit|double your|wallet recovery)\b',re.I)

def source_url(source,page=1):
    if source['adapter']=='chain_registry': return source['url']
    if source['adapter']=='github_org':
        org=source['org']
        if not re.fullmatch(r'[A-Za-z0-9-]{1,39}',org): raise ValueError('Invalid configured organization')
        return f'https://api.github.com/orgs/{org}/repos?type=public&sort=updated&per_page=100&page={page}'
    raise ValueError('Unsupported or disabled source adapter')

def parse_source(source,payload):
    if not isinstance(payload,list) or not payload: raise ValueError('Expected a nonempty public registry array')
    out=[];review=[]
    for row in payload:
        try:
            if source['adapter']=='chain_registry':
                chain=row['chainId']
                if chain not in source['chain_ids']: continue
                url=https_url(row['infoURL']); name=row['name']; network=source['chain_names'][str(chain)]
                if not isinstance(name,str) or not name.strip(): raise ValueError('Missing chain name')
                item={'id':f'chain:eip155:{chain}','name':name,'description':f'Public network metadata for {name} (EVM chain ID {chain}).',
                      'type':'blockchain','category':'Network','networks':[network],
                      'aliases':[row.get('shortName',network)],'identifiers':[f'eip155:{chain}'],
                      'tags':['blockchain','network','EVM'],'official_links':{'website':url}}
            elif source['adapter']=='github_org':
                if row.get('private') or row.get('fork') or row.get('archived') or row.get('disabled'): continue
                owner=row.get('owner',{})
                if owner.get('login','').lower()!=source['org'].lower() or owner.get('type')!='Organization':
                    raise ValueError('Unexpected repository publisher')
                name=row['name']; full=row['full_name'];url=https_url(row['html_url'])
                if full.lower()!=(source['org']+'/'+name).lower() or canonical(url)!=canonical('https://github.com/'+full):
                    raise ValueError('Conflicting repository identity/URL')
                if not isinstance(name,str) or not name or len(name)>100: raise ValueError('Invalid repository name')
                desc=row.get('description') or f'Public developer repository published by {source["org"]}.'
                if SUSPICIOUS.search(name+' '+desc): raise ValueError('Suspicious claims require review')
                item={'id':'github:'+full.lower(),'name':full,'description':str(desc)[:600],
                      'type':'tool','category':'Developer tools','networks':source['networks'],
                      'aliases':[name],'identifiers':['github:'+full.lower()],
                      'tags':['developer','repository',source['org']],
                      'official_links':{'website':url},'publisher':{'organization':source['org'],'url':'https://github.com/'+source['org']},
                      'source_updated_at':row.get('updated_at'),
                      'repository_license':(row.get('license') or {}).get('spdx_id','NOASSERTION')}
            else: raise ValueError('Unsupported source adapter')
            item['source_id']=source['id'];item['verification_status']='unverified'
            item['provenance']=[{'url':source_url(source),'attribution':source.get('attribution','GitHub public repository metadata: '+source.get('org','')),
                                 'terms_url':source.get('license_url','https://docs.github.com/en/site-policy/github-terms/github-terms-of-service')}]
            out.append(item)
        except (KeyError,TypeError,ValueError) as error:
            review.append({'source_id':source['id'],'reason':str(error),'record_reference':str(row.get('chainId',row.get('full_name','unknown')))[:180] if isinstance(row,dict) else 'invalid row'})
    return out[:source['max_records']],review
