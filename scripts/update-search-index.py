#!/usr/bin/env python3
"""Discover/refresh a bounded public catalog. Never commits, pushes or deploys."""
import argparse
import copy
import datetime as dt
import json
import os
import sys
from pathlib import Path
from indexlib import ROOT,read,dump,validate,canonical,merged_catalog,outputs,write_outputs
from index_http import PublicHTTP
from source_adapters import source_url,parse_source

VOLATILE={'last_seen_at','discovered_at','updated_at','link_health','quality_flags'}
def semantic(item): return {k:v for k,v in item.items() if k not in VOLATILE and k!='domain'}
def time_now(): return dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00','Z')

def save_attempt(root,report):
    folder=root/'reports';folder.mkdir(exist_ok=True)
    (folder/'index-latest-attempt.json').write_text(json.dumps(report,indent=2)+'\n')

def run(root=ROOT,http=None,now=None,bootstrap=False,check_links=True):
    now=now or time_now()
    prior_state={}
    report={'schema_version':1,'started_at':now,'status':'running','total_indexed_records':0,
            'new_records_discovered':0,'existing_records_updated':0,'duplicate_records_detected':0,
            'broken_links_detected':0,'records_requiring_review':[], 'data_sources_successfully_checked':[],
            'failed_data_sources':[],'last_successful_indexing_time':prior_state.get('last_successful_indexing_time'),
            'unsupported_sources':[],'errors':[]}
    try:
        config=read(root/'data/index-sources/config.json');limits=config['limits']
        http=http or PublicHTTP(limits,root/'.index-cache')
        previous_auto=read(root/'data/discovered-records.json',[])
        prior_state=read(root/'data/index-state.json',{})
        report['last_successful_indexing_time']=prior_state.get('last_successful_indexing_time')
        report['unsupported_sources']=config.get('future_sources',[])
        for item in previous_auto: validate(item,True)
        baseline,_=merged_catalog(root)
        old={x['id']:x for x in baseline}
        auto={x['id']:copy.deepcopy(x) for x in previous_auto}
        for source in config['sources']:
            try:
                payload,cached=http.json(source_url(source))
                admitted,reviews=parse_source(source,payload)
                report['records_requiring_review'].extend(reviews)
                if not admitted: raise ValueError('No eligible records; retaining prior source records')
                # A changed source cannot erase previously seen entries merely by omitting them.
                for item in admitted:
                    prior=auto.get(item['id'])
                    item['discovered_at']=prior['discovered_at'] if prior else now
                    item['updated_at']=prior['updated_at'] if prior and semantic(prior)==semantic(item) else now
                    item['last_seen_at']=now
                    validate(item,True)
                    auto[item['id']]=item
                report['data_sources_successfully_checked'].append({'id':source['id'],'eligible_records':len(admitted),'not_modified':cached})
            except Exception as error:
                report['failed_data_sources'].append({'id':source['id'],'error':type(error).__name__+': '+str(error)[:250], 'previous_records_preserved':True})
        if not report['data_sources_successfully_checked']:
            raise ValueError('Every configured source failed; last successful index is unchanged')
        for item in auto.values():
            flags=set(item.get('quality_flags',[])) - {'stale_source_data'}
            age=(dt.datetime.fromisoformat(now.replace('Z','+00:00'))-dt.datetime.fromisoformat(item['last_seen_at'].replace('Z','+00:00'))).days
            if age>90: flags.add('stale_source_data')
            if flags: item['quality_flags']=sorted(flags)
            else: item.pop('quality_flags',None)
        automatic=sorted(auto.values(),key=lambda x:x['id'])
        health=read(root/'data/link-health.json',{})
        candidate,duplicates=merged_catalog(root,automatic,health)
        report['duplicate_records_detected']=len(duplicates);report['duplicates']=duplicates
        # Never automatically replace a previously indexed record with another destination.
        for item in candidate:
            if item['id'] in old and canonical(item['official_links']['website'])!=canonical(old[item['id']]['official_links']['website']):
                raise ValueError('Destination change requires explicit review: '+item['id'])
        new=[x for x in candidate if x['id'] not in old]
        updated=[x for x in candidate if x['id'] in old and semantic(x)!=semantic(old[x['id']])]
        removed=set(old)-{x['id'] for x in candidate}
        exclusions=read(root/'data/index-exclusions.json',{'ids':[],'urls':[]})
        if any(i not in exclusions['ids'] and canonical(old[i]['official_links']['website']) not in {canonical(u) for u in exclusions['urls']} for i in removed):
            raise ValueError('Unexpected record loss; stopping publication')
        if len(candidate)>limits['max_records']: raise ValueError('Record budget exceeded')
        if len(new)>limits['max_new_per_run'] and not bootstrap: raise ValueError('Unusually large growth; manual review required')
        if len(updated)>max(10,int(len(old)*limits['max_updated_fraction'])) and not bootstrap:
            raise ValueError('Unusually large metadata change; manual review required')
        report['new_records_discovered']=len(new);report['existing_records_updated']=len(updated)
        report['new_record_ids']=[x['id'] for x in new]
        report['links_checked']=0;report['links_attempted']=0;report['link_check_outcomes']={}
        if check_links:
            # Oldest checks first; bounded rotation instead of hammering every site every day.
            urls=sorted({canonical(x['official_links']['website']):x['official_links']['website'] for x in candidate}.items(),key=lambda pair:(health.get(pair[0],{}).get('checked_at',''),pair[0]))
            for key,url in urls[:limits['max_link_checks']]:
                before=health.get(key,{})
                result=http.check_link(url); result['checked_at']=now
                if result['status']=='possibly_broken':
                    separated=not before.get('checked_at') or (dt.datetime.fromisoformat(now.replace('Z','+00:00'))-dt.datetime.fromisoformat(before['checked_at'].replace('Z','+00:00'))).total_seconds()>=72000
                    result['consecutive_failures']=before.get('consecutive_failures',0)+(1 if separated else 0)
                    report['broken_links_detected']+=1
                else: result['consecutive_failures']=0 if result['status'] in ('ok','redirected') else before.get('consecutive_failures',0)
                health[key]=result;report['links_attempted']+=1
                report['links_checked']+=int('http_status' in result)
                report['link_check_outcomes'][result['status']]=report['link_check_outcomes'].get(result['status'],0)+1
        candidate,duplicates=merged_catalog(root,automatic,health)
        for item in candidate:
            flags=[]
            if item.get('link_health',{}).get('consecutive_failures',0)>=2: flags.append('repeated_link_failure')
            seen=item.get('last_seen_at')
            if seen and (dt.datetime.fromisoformat(now.replace('Z','+00:00'))-dt.datetime.fromisoformat(seen.replace('Z','+00:00'))).days>90: flags.append('stale_source_data')
            if flags: report['records_requiring_review'].append({'id':item['id'],'flags':flags})
        files=outputs(candidate,root)
        if len(files['data/search-index.json'].encode())>limits['max_index_bytes']: raise ValueError('Index byte budget exceeded')
        # Validate candidate output before touching any catalog, last-good or runtime input.
        report['status']='partial' if report['failed_data_sources'] else 'success'
        report['total_indexed_records']=len(candidate)
        report['last_successful_indexing_time']=now
        report['finished_at']=time_now()
        report['network_usage']={'requests':http.requests,'response_bytes':http.bytes,'conditional_cache_hits':http.cache_hits}
        report['deployment_status']='not_requested_by_indexer'
        rollback={'discovered_records':previous_auto,'link_health':read(root/'data/link-health.json',{}),'state':prior_state}
        files.update({'data/discovered-records.json':dump(automatic),'data/link-health.json':dump(health),
                      'data/index-state.json':dump({'last_successful_indexing_time':now}),
                      'data/index-rollback.json':dump(rollback),'data/search-last-good.json':dump(baseline),
                      'reports/index-latest.json':json.dumps(report,indent=2)+'\n'})
        write_outputs(files,root);save_attempt(root,report)
        return report,True
    except Exception as error:
        report['status']='blocked';report['errors'].append(type(error).__name__+': '+str(error))
        report['finished_at']=time_now();save_attempt(root,report)
        return report,False

def rollback(root=ROOT):
    backup=read(root/'data/index-rollback.json')
    if not backup: raise ValueError('No previous indexing snapshot exists')
    records,_=merged_catalog(root,backup['discovered_records'],backup['link_health'])
    files=outputs(records,root)
    files.update({'data/discovered-records.json':dump(backup['discovered_records']),
                  'data/link-health.json':dump(backup['link_health']),'data/index-state.json':dump(backup['state'])})
    write_outputs(files,root)
    return len(records)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--bootstrap',action='store_true',help='Local initial reviewed import only; forbidden in GitHub Actions')
    parser.add_argument('--skip-links',action='store_true',help='Discovery-only diagnostic; scheduled runs always check links')
    parser.add_argument('--rollback',action='store_true',help='Restore the last generated snapshot locally; does not publish')
    args=parser.parse_args()
    if args.bootstrap and os.environ.get('GITHUB_ACTIONS'): raise SystemExit('Bootstrap is a local reviewed operation only')
    if args.rollback:
        print('Restored previous snapshot:',rollback(),'records');raise SystemExit(0)
    report,ok=run(bootstrap=args.bootstrap,check_links=not args.skip_links)
    print(json.dumps({key:report[key] for key in ('status','total_indexed_records','new_records_discovered','existing_records_updated','failed_data_sources','errors')},indent=2))
    raise SystemExit(0 if ok else 1)
