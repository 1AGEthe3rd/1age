(() => {
 const ticker=document.querySelector('.living-ticker');
 if(!ticker)return;
 // Keep the ticker outside all moving search/layout containers.
 document.body.append(ticker);
 document.body.classList.add('ticker-positioned');
 function sync(){
  const body=document.body;
  const editing=Boolean(document.activeElement?.matches?.('input,textarea,[contenteditable="true"]'));
  const suppressed=editing||['search-open','results-open','information-open'].some(c=>body.classList.contains(c));
  ticker.hidden=suppressed;
  ticker.inert=suppressed;
  if(suppressed)ticker.style.setProperty('display','none','important');
  else ticker.style.removeProperty('display');
 }
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
 document.addEventListener('focusin',sync);
 document.addEventListener('focusout',()=>requestAnimationFrame(sync));
 window.addEventListener('pageshow',sync);
 window.addEventListener('1age-home-restored',sync);
 sync();
})();