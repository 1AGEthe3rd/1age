const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');const apps=JSON.parse(fs.readFileSync(path.join(root,'data/app-domains.json')));
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'1age-app-entry-'));
try {
  execFileSync('python3',['scripts/build-app-entrypoints.py','--output',directory],{cwd:root});
  for(const app of apps){
    const html=fs.readFileSync(path.join(directory,app.repository,'index.html'),'utf8');
    assert(html.includes('<title>'+app.name+'</title>'));
    assert(html.includes('https://1age.com/home/'+app.slug+'/'));
    const js=fs.readFileSync(path.join(directory,app.repository,'app-entry.js'),'utf8');
    let target;
    const context={document:{body:{dataset:{ageApp:app.slug}}},location:{search:'?q=wallet&app=evil&url=https://evil.example',hash:'#explore',replace:url=>target=url},URL,URLSearchParams,Set};
    vm.runInNewContext(js,context);const url=new URL(target);
    assert.equal(url.origin,'https://1age.com');assert.equal(url.pathname,'/home/'+app.slug+'/');
    assert.equal(url.searchParams.get('q'),'wallet');assert.equal(url.searchParams.get('app'),null);assert.equal(url.searchParams.get('url'),null);assert.equal(url.hash,'#explore');
    const icon=fs.readFileSync(path.join(directory,app.repository,'app-favicon.svg'),'utf8');
    assert(icon.includes('<circle')&&icon.includes('fill="#000"'));
    const home=fs.readFileSync(path.join(root,'home',app.slug,'index.html'),'utf8');
    assert(home.includes('<title>'+app.name+'</title>'));
    assert(home.includes('data-home-app="'+app.slug+'"'));
    const native=['games','page','space','exchange','quest','cash','design'].includes(app.slug);
    const entry=native?'oneage://world/enter?destination='+app.slug:'/apps/'+app.slug+'/';
    assert(home.includes('class="world-entry" href="'+entry+'"'));
    assert(home.includes(native?'>Enter</a>':'>Open app</a>'));
    assert(home.includes('/world.js?v=home-refinement-001'));
    assert(home.includes('/living-ticker.js?v=home-refinement-001'));
    assert(home.includes('/search-index.js?v=daily-index-001'));
    const workspace=fs.readFileSync(path.join(root,'apps',app.slug,'index.html'),'utf8');
    assert(workspace.includes('<title>'+app.name+'</title>'));
    assert(workspace.includes('/assets/app-icons/'+app.slug+'.svg'));
    assert(workspace.includes('src="/app-home.js"'));
    assert(workspace.includes('src="/search-toggle.js"'));
  }
  console.log(`App entry checks passed: ${apps.length} aliases, exact titles, approved circle icons, query preservation, open-redirect prevention and canonical shared components.`);
}finally{fs.rmSync(directory,{recursive:true,force:true});}
