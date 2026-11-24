const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../responsive-home.js'),'utf8');
function setup(site,ua,platform,touch,land){
 const root={dataset:{homeSite:site},style:{setProperty(){}}};const window={addEventListener(){},dispatchEvent(){}};
 vm.runInNewContext(source,{document:{documentElement:root},window,navigator:{userAgent:ua,platform,maxTouchPoints:touch},matchMedia:()=>({matches:land,addEventListener(){}}),Event:function(){}});
 return {root,model:window.OneAGEHomeLayout};
}
test('touchscreen laptops always retain desktop spatial layout',()=>{for(const land of [true,false]){const {root}=setup('search','Mozilla X11 Linux','Linux',10,land);assert.equal(root.dataset.touchLayout,'desktop');assert.equal(root.dataset.orbitDepth,'spatial');}});
test('only search phone portrait is flat',()=>{for(const site of ['search','studio'])for(const land of [true,false]){const {root}=setup(site,'iPhone','iPhone',5,land);assert.equal(root.dataset.touchLayout,land?'landscape':'portrait');assert.equal(root.dataset.orbitDepth,site==='search'&&!land?'flat':'spatial');}});
test('responsive geometry fits the scene and foreground crosses the globe',()=>{const {model}=setup('search','X11 Linux','Linux',10,true);for(const [w,h,flat,portrait] of [[1280,590,false,false],[1920,850,false,false],[844,260,false,false],[667,210,false,false],[390,650,true,true],[320,450,true,true],[390,650,false,true]]){const d=model.dimensions(w,h,flat,portrait);assert.ok(d.earth>0);assert.ok(d.orbitW+d.planet<=w+2);assert.ok(d.orbitH+d.planet<=h+2);if(!flat){assert.ok(d.orbitH<d.earth);assert.ok(d.orbitW>d.earth);}else{assert.equal(d.orbitW,d.orbitH);assert.ok(d.earth+d.planet<d.orbitW);}}});
