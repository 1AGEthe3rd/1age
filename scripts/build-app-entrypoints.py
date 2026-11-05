#!/usr/bin/env python3
"""Generate app domain entrypoints that reuse the canonical 1AGE homepage.

Only a staging/output directory is written. Existing repositories and CNAME files
are not touched by this generator.
"""
import argparse
import html
import json
import shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCRIPT='''(() => {
  'use strict';
  const slug = document.body.dataset.ageApp;
  const allowed = new Set(['games','page','exchange','space','design','quest','cash','plus','app','store','shop']);
  if (!allowed.has(slug)) return;
  const target = new URL('https://1age.com/home/' + slug + '/');
  const query = new URLSearchParams(location.search).get('q');
  if (query) target.searchParams.set('q', query.slice(0, 200));
  if (location.hash.length <= 300) target.hash = location.hash;
  location.replace(target.href);
})();
'''

def page(app):
    name=html.escape(app['name']);slug=app['slug'];target='https://1age.com/home/'+slug+'/'
    desc=f'Open {name} with the shared 1AGE interface and blockchain search.'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{name}</title><meta name="application-name" content="{name}">
<meta name="description" content="{desc}"><meta name="theme-color" content="#000000">
<link rel="canonical" href="{target}"><meta property="og:type" content="website"><meta property="og:site_name" content="{name}">
<meta property="og:title" content="{name}"><meta property="og:description" content="{desc}"><meta property="og:url" content="https://{app['domain']}/">
<link rel="icon" type="image/svg+xml" href="/app-favicon.svg?v=shared-home-001"><link rel="icon" type="image/png" sizes="96x96" href="/app-favicon.png?v=shared-home-001">
<link rel="apple-touch-icon" sizes="96x96" href="/app-favicon.png?v=shared-home-001">
<meta http-equiv="refresh" content="1;url={target}">
<style>html{{color-scheme:dark;background:#000;color:#E2FFDC;font-family:system-ui,sans-serif}}body{{margin:0;min-height:100dvh;display:grid;place-content:center;text-align:center}}a{{color:#1BFD9C}}img{{width:80px;height:80px;margin:auto}}</style>
</head><body data-age-app="{slug}"><img src="/app-favicon.svg" alt=""><h1>{name}</h1><p><a href="{target}">Open {name}</a></p><script src="/app-entry.js"></script></body></html>
'''

def build(directory):
    for app in json.loads((ROOT/'data/app-domains.json').read_text()):
        dest=directory/app['repository'];dest.mkdir(parents=True,exist_ok=True)
        (dest/'index.html').write_text(page(app));(dest/'app-entry.js').write_text(SCRIPT)
        for suffix in ['svg','png']:
            shutil.copyfile(ROOT/'assets/app-icons'/(app['slug']+'.'+suffix),dest/('app-favicon.'+suffix))
    return directory
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True)
    a=p.parse_args();build(a.output);print('App domain entrypoints staged at',a.output)
