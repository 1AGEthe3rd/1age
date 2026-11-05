#!/usr/bin/env node
// The same pure query/ranking engine used by the website; no network or DOM.
const fs=require('node:fs'),path=require('node:path');
const core=require('../search-core.js').createEngine(require('../assets/vendor/minisearch-7.2.0.js'));
const records=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/search-index.json')));
const query=process.argv.slice(2).join(' ');
console.log(JSON.stringify({query,interpretation:core.plan(query),results:core.search(records,query).slice(0,20)},null,2));
