// Read-only extraction of reviewed source commits. No network, push, repo creation or deployment.
import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname,join,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const registry=JSON.parse(readFileSync(new URL('./domain-routing-20261126.json',import.meta.url),'utf8'));
const [id,output]=process.argv.slice(2);
const app=registry.applications.find(a=>a.id===id&&a.state==='migration_required');
if(!app||!output)throw Error('Usage: node release-plans/package-standalone.mjs <work|forum|autos|services|pics|online|lol> <new output directory>');
const dest=resolve(output);if(existsSync(dest))throw Error('Output already exists; refusing to overwrite');
const root=execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
const git=(args)=>execFileSync('git',args,{cwd:root,maxBuffer:32*1024*1024});
const commit=app.migrationSourceCommit;if(!/^[0-9a-f]{40}$/.test(commit))throw Error('Invalid pinned source');
git(['cat-file','-e',commit+'^{commit}']);
const prefix='prototypes/1age-'+id+'/';
const entries=git(['ls-tree','-r','-z',commit,'--',prefix]).toString('utf8').split('\0').filter(Boolean);
const files=new Map();
for(const entry of entries){const [meta,path]=entry.split('\t');if(!meta.startsWith('100644 blob ')||!path.startsWith(prefix))throw Error('Unexpected source entry '+entry);const name=path.slice(prefix.length);if(!name||name.split('/').some(x=>!x||x==='..'||x==='.'))throw Error('Invalid path');let content=git(['show',commit+':'+path]);if(/\.(html|mjs|css|js)$/.test(name))content=Buffer.from(content.toString('utf8').replaceAll('../../experiences/shared/','../experiences/shared/').replaceAll('../../assets/','../assets/').replaceAll('../../favicon-brand.svg','../favicon-brand.svg'));files.set('spatial/'+name,content);}
const assets=['experiences/shared/vendor/three.module.js','experiences/shared/vendor/three.core.js','experiences/shared/gamepad.mjs','experiences/shared/gamepad-model.mjs','experiences/shared/gamepad.css','experiences/shared/world-surface.png','assets/1age-logo.svg','favicon-brand.svg'];for(const path of assets)files.set(path,git(['show',commit+':'+path]));
const index=files.get('spatial/index.html')?.toString('utf8');if(!index?.includes('<head>')||!index.includes('id="scene"'))throw Error('Expected walkable scene entry not present');
files.set('index.html',Buffer.from(index.replace('<head>','<head><base href="./spatial/"><link rel="canonical" href="https://'+app.domain+'/">')));
files.set('CNAME',Buffer.from(app.domain+'\n'));files.set('.nojekyll',Buffer.alloc(0));
files.set('README.md',Buffer.from('# 1AGE '+id+' — migration candidate\n\nPinned source: '+commit+'\n\nOriginal prototype notes: spatial/README.md. Review dependencies and rights, test browser and iPhone/controller, verify domain ownership and HTTPS before publication. No actual deployment was performed.\n'));
// Validate explicit local module imports and HTML entry references before writing.
for(const [name,bytes] of files){if(!name.startsWith('spatial/')||!name.endsWith('.mjs')&&!name.endsWith('.html'))continue;const source=bytes.toString('utf8');const refs=name.endsWith('.mjs')?[...source.matchAll(/(?:from\s*|import\s*)['"]([.][^'"]+)['"]/g),...source.matchAll(/new URL\(\s*['"]([.][^'"]+)['"],\s*import\.meta\.url/g)]:[...source.matchAll(/(?:src|href)=["']([.][^"']+)["']/g)];for(const m of refs){const target=relative(dest,resolve(dest,dirname(name),m[1].split(/[?#]/)[0])).split(sep).join('/');if(target.startsWith('../')||!files.has(target))throw Error(name+' has unresolved local reference '+m[1]);}}
mkdirSync(dest,{recursive:false});for(const [name,bytes] of files){const path=join(dest,name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,bytes,{flag:'wx'});}
console.log('Prepared '+files.size+' files for '+app.domain+' from '+commit+'. No repository or DNS was modified.');
