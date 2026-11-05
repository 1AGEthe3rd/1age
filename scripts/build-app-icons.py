#!/usr/bin/env python3
"""Reuse approved homepage SVGs in app favicons; no new logo designs."""
import re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ACCENTS={'page':'#55B8FF','space':'#E2FFDC','games':'#FFBB55','exchange':'#50E3D4','quest':'#C18BFF','cash':'#1BFD9C'}

def icons():
    source=(ROOT/'index.html').read_text();result={}
    for slug,color in ACCENTS.items():
        match=re.search(r'<a\b[^>]*aria-label="Open 1AGE '+slug.capitalize()+r'"[^>]*>(.*?)</a>',source,re.S)
        if not match: raise ValueError('Approved icon missing: '+slug)
        svg=re.search(r'<svg\b.*?</svg>',match.group(1),re.S).group()
        svg=svg.replace('<svg ', '<svg x="18" y="18" width="64" height="64" ',1)
        result[slug]=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#000" stroke="{color}" stroke-width="3"/><g color="{color}">{svg}</g></svg>\n'
    # No separate approved application marks exist for these entries yet.
    # Preserve the real 1AGE logo on its original black circle.
    for slug in ['design','plus','app','store','shop','world']:
        result[slug]=(ROOT/'assets/1age-logo.svg').read_text()
    return result
if __name__=='__main__':
    import argparse
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--check',action='store_true');a=p.parse_args()
    for slug,content in icons().items():
        dest=ROOT/'assets/app-icons'/f'{slug}.svg'
        if a.check:
            if not dest.exists() or dest.read_text()!=content:raise SystemExit('Stale icon: '+slug)
        else:dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content)
    print('Approved app icons validated.' if a.check else 'Approved app icons generated.')
