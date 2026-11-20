// If WebGL or module loading fails, essential reading and checkout controls stay usable in 2D.
for(const host of document.querySelectorAll('.viewport[data-model]')){
 if(host.closest('#publication'))continue;
 import('./viewer.js').then(({createViewer})=>createViewer(host,{model:host.dataset.model,showroom:host.dataset.model==='brand'})).catch(()=>{host.querySelector('.fallback-note').textContent='2D view · Interactive 3D is unavailable.';});
}
