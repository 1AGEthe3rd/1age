#!/usr/bin/env python3
"""Build deterministic search data from curated and discovered records, without network access."""
import argparse
from indexlib import ROOT, merged_catalog, outputs, write_outputs

def build():
    records,_=merged_catalog()
    return outputs(records)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check',action='store_true')
    args=parser.parse_args(); files=build()
    if args.check:
        for path,content in files.items():
            target=ROOT/path
            if not target.exists() or target.read_text()!=content:
                raise SystemExit(f'Stale generated file: {path}; run python3 scripts/build-search-index.py')
        print('Search catalog and all referenced shards validated.')
    else:
        write_outputs(files);print('Search catalog and immutable shards generated.')
