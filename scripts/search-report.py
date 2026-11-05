#!/usr/bin/env python3
"""Render the machine report into the GitHub Actions job summary."""
from indexlib import ROOT,read
r=read(ROOT/'reports/index-latest-attempt.json',{})
print('# 1AGE daily search index\n')
for key in ('status','total_indexed_records','new_records_discovered','existing_records_updated','duplicate_records_detected','broken_links_detected','links_checked','links_attempted','last_successful_indexing_time'):
    print(f'- {key.replace("_"," ").capitalize()}: {r.get(key,"not available")}')
print('\n## Source checks\n')
for source in r.get('data_sources_successfully_checked',[]): print('- '+source['id']+': '+str(source['eligible_records'])+' eligible records')
for source in r.get('failed_data_sources',[]): print('- '+source['id']+': failed; previous records retained')
print('\n- Records requiring review: '+str(len(r.get('records_requiring_review',[]))))
print('- Deployment status: '+r.get('deployment_status','not requested'))
for error in r.get('errors',[]):print('- Error: '+error.replace('\n',' '))
