#!/usr/bin/env python3
"""Build a deterministic public metadata index without network access or paid APIs."""
import argparse
import collections
import datetime
import json
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ('data/1age-index.json', 'data/entities.json', 'data/blockchain-seeds.json')

def https_url(value):
    url = urlsplit(value)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or url.port not in (None, 443):
        raise ValueError(f'Expected a public HTTPS URL: {value!r}')
    if url.hostname in ('localhost',) or '.' not in url.hostname:
        raise ValueError(f'Expected a public domain: {value!r}')
    return value

def build():
    overrides = json.loads((ROOT / 'data/search-overrides.json').read_text())
    ids, urls, records = set(), set(), []
    for source in SOURCES:
        for original in json.loads((ROOT / source).read_text()):
            item = dict(original, **overrides.get(original['id'], {}))
            for key in ('id', 'name', 'description', 'type', 'category'):
                if not isinstance(item.get(key), str) or not item[key].strip():
                    raise ValueError(f'Missing {key}: {item.get("id")}')
            url = https_url(item['official_links']['website'])
            # Preserve HTTP paths and case; only normalize hostname and trailing slash for duplicate checks.
            parsed = urlsplit(url)
            canonical = (parsed.hostname.lower(), parsed.path.rstrip('/'), parsed.query)
            if item['id'] in ids or canonical in urls:
                raise ValueError(f'Duplicate id or destination: {item["id"]}')
            ids.add(item['id']); urls.add(canonical)
            item.setdefault('networks', [])
            item.setdefault('aliases', [])
            if not all(isinstance(n, str) and n for n in item['networks']):
                raise ValueError('Invalid networks')
            review = item.get('source_review')
            if review:
                datetime.date.fromisoformat(review['checked_on'])
                if review['status'] != 'source_checked' or not review['evidence']:
                    raise ValueError('Missing source evidence')
                for evidence in review['evidence']:
                    https_url(evidence)
            item['domain'] = parsed.hostname.removeprefix('www.')
            # No boost or trust score based on ecosystem ownership.
            records.append(item)
    records.sort(key=lambda x: x['id'])
    data = json.dumps(records, ensure_ascii=False, separators=(',', ':')) + '\n'
    networks = collections.Counter(n for x in records for n in x['networks'])
    manifest = json.dumps({'schema_version':1,'records':len(records),'networks':dict(sorted(networks.items())),
                           'sources':list(SOURCES),'source_checked':sum('source_review' in x for x in records)},indent=2)+'\n'
    return {'data/search-index.json':data,'data/search-manifest.json':manifest}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if generated files differ; never writes files')
    args = parser.parse_args()
    for path, content in build().items():
        target = ROOT / path
        if args.check:
            if not target.exists() or target.read_text() != content:
                raise SystemExit(f'Stale generated index: {path}; run python3 scripts/build-search-index.py')
        else:
            target.write_text(content)
    print('Search index validated.' if args.check else 'Search index generated.')
