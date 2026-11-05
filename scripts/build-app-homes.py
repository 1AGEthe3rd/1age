#!/usr/bin/env python3
"""Render application entry routes from the existing canonical homepage template."""
import argparse
import html
import json
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
NAMES={app['slug']:app['name'] for app in json.loads((ROOT/'data/app-domains.json').read_text())}
NAMES['world']='1AGE World'

def homes():
    template=(ROOT/'index.html').read_text();result={}
    for slug,name in NAMES.items():
        route='https://1age.com/home/'+slug+'/'
        description='Explore '+name+' through the shared 1AGE interface.'
        page=re.sub(r'<title>.*?</title>','<title>'+name+'</title>',template,count=1,flags=re.S)
        for selector,value in [('name="description"',description),('property="og:title"',name),('property="og:site_name"',name),('property="og:description"',description),('property="og:url"',route)]:
            page=re.sub(r'<meta '+selector+r' content="[^"]*">','<meta '+selector+' content="'+html.escape(value,quote=True)+'">',page,count=1)
        page=re.sub(r'<link rel="canonical" href="[^"]*">','<link rel="canonical" href="'+route+'">',page,count=1)
        page=page.replace('<body class="home-screen">','<body class="home-screen" data-home-app="'+slug+'">',1)
        native = slug in {'world','games','page','space','exchange','quest','cash','design'}
        entry = 'oneage://world/enter?destination='+slug if native else '/apps/'+slug+'/'
        entry_label = 'Enter '+name+' 3D on this computer' if native else 'Open '+name+' app'
        page=re.sub(r'<a class="world-entry"[^>]*>.*?</a>', '<a class="world-entry" href="'+entry+'" aria-label="'+entry_label+'">'+('Enter' if native else 'Open app')+'</a>',page,count=1)

        page=re.sub(r'(<span class="brand-name">).*?(</span>)',lambda m:m[1]+name.removeprefix('1AGE ')+m[2],page,count=1)
        page=re.sub(r'(<h1\b[^>]*id="search-title"[^>]*>).*?(</h1>)',lambda m:m[1]+'Search '+name+m[2],page,count=1,flags=re.S)
        page=re.sub(r'<link rel="icon"[^>]*>','',page)
        page=page.replace('</head>',f'<link rel="icon" type="image/svg+xml" href="/assets/app-icons/{slug}.svg"><link rel="icon" type="image/png" sizes="96x96" href="/assets/app-icons/{slug}.png"></head>',1)
        page=page.replace('/assets/apple-touch-icon-1.png','/assets/app-icons/'+slug+'.png')
        def schema(match):
            value=json.loads(match[1])
            for obj in value.get('@graph',[]):
                if obj.get('@type')=='WebPage':obj.update({'@id':route+'#page','url':route,'name':name,'description':description})
            return '<script type="application/ld+json">'+json.dumps(value,separators=(',',':'))+'</script>'
        page=re.sub(r'<script type="application/ld\+json">(.*?)</script>',schema,page,count=1,flags=re.S)
        result[f'home/{slug}/index.html']=page
    return result
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--check',action='store_true');a=p.parse_args()
    for name,content in homes().items():
        dest=ROOT/name
        if a.check:
            if not dest.exists() or dest.read_text()!=content:raise SystemExit('Stale generated app homepage: '+name)
        else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content)
    print('Canonical app homepages validated.' if a.check else 'Canonical app homepages generated.')
