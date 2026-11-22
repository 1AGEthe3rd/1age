"""Derive the Games seed catalog from the shared search index; unknown chains stay unknown."""
import argparse,json
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
def safe(value):
 try:u=urlsplit(value);return u.scheme=='https' and u.hostname and not u.username and not u.password
 except (TypeError,ValueError):return False
def build():
 rows=json.loads((ROOT/'data/search-index.json').read_text());evidence=json.loads((ROOT/'data/games-network-evidence.json').read_text());games=[];seen=set()
 for r in rows:
  if r['type'] not in ('game','games') or r['id'].startswith('1age-') or r['id'] in seen or r.get('source_review',{}).get('status')!='source_checked' or not safe(r.get('official_links',{}).get('website')):continue
  seen.add(r['id']);network=evidence.get(r['id'],{});checked=bool(network.get('ecosystem') and safe(network.get('source')))
  games.append({'id':r['id'],'name':r['name'],'description':r['description'],'website':r['official_links']['website'],'source_review':r['source_review'],'ecosystem':network['ecosystem'] if checked else None,'ecosystem_evidence':network['source'] if checked else None,'network_checked_on':network.get('checked_on') if checked else None,'rewards_status':'not verified','playability_status':'not tested'})
 return json.dumps({'games':games,'coverage':'Seed catalog only; not comprehensive blockchain-game coverage.'},indent=2)+'\n'
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args();out=ROOT/'experiences/games/catalog.json';text=build()
 if args.check:
  if out.read_text()!=text:raise SystemExit('Stale Games catalog; rebuild before packaging')
 else:out.write_text(text)
 print('Games catalog checked' if args.check else 'Games catalog generated')
