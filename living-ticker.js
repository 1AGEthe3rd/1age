(() => {
  const hoverable = matchMedia('(hover: hover)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('.living-ticker').forEach(ticker => {
    const disclosure = ticker.querySelector('details');
    const headline = ticker.querySelector('.ticker-headline');
    const panel=ticker.querySelector('.ticker-details');
    const summary=disclosure.querySelector('summary');
    const trigger=document.createElement('button');
    trigger.type='button';trigger.className='ticker-summary';
    trigger.setAttribute('aria-haspopup','dialog');
    trigger.setAttribute('aria-controls','application-information');
    trigger.title='Drag left to skip, right to replay. Tap for application information.';
    trigger.append(...summary.childNodes);
    disclosure.replaceWith(trigger);
    const info=document.createElement('dialog');
    info.id='application-information';info.className='application-information';
    info.setAttribute('aria-labelledby','application-information-title');
    info.innerHTML='<header><button type="button" class="info-home" aria-label="Return to 1AGE home"><img src="/assets/1age-logo.svg" alt="" width="44" height="44"></button><h1 id="application-information-title" tabindex="-1">1AGE information</h1><button type="button" class="info-close" aria-label="Close application information">×</button></header>';
    panel.hidden=false;info.append(panel);document.body.append(info);
    function openInfo(push=true){
      if(info.open)return;
      if(push && location.hash!=='#application-info')history.pushState({...history.state,ageTickerInfo:true},'',location.pathname+location.search+'#application-info');
      document.body.classList.add('information-open');info.showModal();
      info.querySelector('h1').focus({preventScroll:true});showAnnouncement();
    }
    function closeInfo(navigate=true){
      if(info.open)info.close();
      document.body.classList.remove('information-open');
      if(navigate && location.hash==='#application-info'){
        if(history.state?.ageTickerInfo)history.back();
        else history.replaceState(history.state,'',location.pathname+location.search);
      }
      trigger.focus({preventScroll:true});
      window.dispatchEvent(new Event('1age-home-restored'));showAnnouncement();
    }
    info.querySelector('.info-home').addEventListener('click',()=>closeInfo());
    info.querySelector('.info-close').addEventListener('click',()=>closeInfo());
    info.addEventListener('cancel',event=>{event.preventDefault();closeInfo();});
    window.addEventListener('popstate',()=>{if(location.hash==='#application-info')openInfo(false);else if(info.open)closeInfo(false);});
    const viewport = headline.parentElement;
    const pause = ticker.querySelector('.ticker-pause');
    let announcements = [...panel.querySelectorAll('[data-animation]')]
      .sort((a, b) => Number(b.dataset.priority || 0) - Number(a.dataset.priority || 0));

    let activeName = '';
    function paintText(node, text) {
      node.replaceChildren();
      if(!activeName){node.textContent=text;return;}
      const names=new RegExp('\\b(?:1AGE\\s+)?'+activeName+'\\b','g');
      let start=0;
      for(const match of text.matchAll(names)){
        node.append(document.createTextNode(text.slice(start,match.index)));
        const name=document.createElement('span');name.className='ticker-app-name';name.textContent=match[0];node.append(name);
        start=match.index+match[0].length;
      }
      node.append(document.createTextNode(text.slice(start)));
    }

    const projects = {
      page: ['1AGE Page — Identity and social discovery.', 'Create a profile in the current browser workspace.', 'The planned 3D social interface links your external profiles through orbiting planets. Shared accounts and native messaging are in development.'],
      space: ['1AGE Space — Virtual Spaces. Real Places.', 'Discover virtual spaces and commercial properties.', 'The current workspace saves space links locally. Property search, owner claims and authorized virtual occupancy are planned.'],
      games: ['1AGE Games — Discover games. Find your next experience.', 'Play the existing local two-player game.', 'Gaming discovery and in-house titles, including NNB, are part of the development roadmap.'],
      exchange: ['1AGE Exchange — A free Virtual Financial Platform.', 'Connect existing wallets across chains: the product direction.', 'The current browser tool is a manual conversion sandbox. Wallet connections, payments and swaps are in development.'],
      quest: ['1AGE Quest — Explore. Learn. Earn.', 'Discover blockchain learning opportunities and a connected story adventure.', 'The current workspace tracks local objectives. Page Identity is the planned first story chapter; rewards are not live.'],
      cash: ['1AGE Cash — Internal ecosystem credits.', 'Cash is account-based credit, separate from the proposed $1AGE cryptocurrency.', 'The current workspace is a local demonstration ledger. It does not issue real credits, hold money or perform blockchain transactions.'],
      design: ['1AGE Design — Create your next space.', 'Try the browser title, subtitle and accent-color workspace.', 'Environment creation and publishing connect to the wider creator-tool roadmap.'],
      plus: ['1AGE Plus — Optional membership.', 'The planned membership is $1 per month.', 'Current preferences are local. This page does not enroll or charge anyone.'],
      shop: ['1AGE Shop — Discover blockchain creators and products.', 'The public marketplace direction connects independent creators and merchants.', 'The current product-link catalog is browser-local. Shared marketplace services are in development.'],
      store: ['1AGE Store — Official studio products.', 'The official store belongs to 1AGEthe3rd.', 'The current browser catalog is local. Checkout and public product listings are not connected here.'],
      app: ['1AGE App — Discover the applications.', 'Browse links to the existing 1AGE workspaces.', 'Application discovery and distribution scope will expand as features are completed.'],
      work: ['1AGE Work — Discover opportunities.', 'Explore local and global work opportunities as development progresses.', 'Employer and contributor workflows are planned; do not assume live job listings.'],
      blog: ['1AGE Blog — Global publishing and independent voices.', 'Discover official publications, independent writers and articles.', 'Open publishing, author identity and moderation are in development.'],
      forum: ['1AGE Forum — Local and global community discussions.', 'Discover community conversations as the service develops.', 'Community posting and moderation are planned.'],
      world: ['1AGE World — One connected universe.', 'Explore the immersive environment and its application destinations.', 'Web hosting and native launch paths are being reconciled; application services develop independently.']
    };
    window.addEventListener('1age-project-selected', event => {
      const {slug, name, accent} = event.detail || {};
      document.body.classList.add('project-selected');
      const facts = projects[slug] || [name, 'Explore this destination through the shared 1AGE interface.'];
      activeName=Object.hasOwn(projects,slug)?slug[0].toUpperCase()+slug.slice(1):'';
      const list = panel;
      list.replaceChildren();
      facts.forEach((fact, i) => {
        const li = document.createElement('li');
        li.dataset.animation = ['full','left','right'][i % 3];
        const title = document.createElement('strong'); paintText(title, fact); li.append(title); list.append(li);
      });
      announcements = [...list.children];
      index = 0;
      ticker.style.setProperty('--ticker-accent', accent || '#1bfd9c');
      ticker.setAttribute('aria-label', name + ' information');
      info.style.setProperty('--ticker-accent',accent||'#1bfd9c');
      info.querySelector('h1').textContent=(activeName?'1AGE '+activeName:name)+' information';
      showAnnouncement();
    });

    let index = 0;
    let timer;
    let animation;
    let paused = false;
    let drag=null,suppressTap=false;

    function showAnnouncement(manual=false) {
      clearTimeout(timer);
      animation?.cancel();
      const announcement = announcements[index];
      headline.replaceChildren(...[...announcement.querySelector('strong').childNodes].map(node=>node.cloneNode(true)));
      headline.classList.remove('ticker-moving');

      if ((matchMedia('(min-width:700px) and (orientation:landscape)').matches && document.body.classList.contains('search-open')) || paused || info.open || drag || reducedMotion.matches || document.hidden ||
          trigger.matches(':focus-visible') ||
          (hoverable.matches && ticker.matches(':hover'))) return;

      const hold = Number(announcement.dataset.duration) || 4000;
      let duration = hold;
      let frames;

      switch (announcement.dataset.animation) {
        case 'up':
          frames = [
            { transform: 'translateY(100%)' },
            { transform: 'translateY(0)', offset: .13 },
            { transform: 'translateY(0)', offset: .87 },
            { transform: 'translateY(-100%)' },
          ];
          break;
        case 'left':
        case 'right': {
          headline.classList.add('ticker-moving');
          const rightward = announcement.dataset.animation === 'right';
          const start = rightward ? -headline.offsetWidth : viewport.clientWidth;
          const end = rightward ? viewport.clientWidth : -headline.offsetWidth;
          duration = Math.max(hold, Math.abs(end - start) / (Number(announcement.dataset.speed) || 65) * 1000);
          frames = [{ transform: `translateX(${start}px)` }, { transform: `translateX(${end}px)` }];
          break;
        }
        case 'full':
          frames = [{ opacity: .55 }, { opacity: 1, offset: .12 }, { opacity: 1 }];
          break;
        case 'glow':
          frames = [
            { textShadow: '0 0 0 transparent' },
            { textShadow: '0 0 .55rem #1bfd9c', offset: .45 },
            { textShadow: '0 0 0 transparent' },
          ];
          break;
      }

      if (frames && manual!==true) animation = headline.animate(frames, { duration, fill: 'both' });
      timer = setTimeout(() => {
        index = (index + 1) % announcements.length;
        showAnnouncement();
      }, duration);
    }

    pause.addEventListener('click', () => {
      paused = !paused;
      pause.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
      pause.setAttribute('aria-label', paused ? 'Resume announcements' : 'Pause announcements');
      pause.setAttribute('aria-pressed', String(paused));
      showAnnouncement();
    });
    function stepMessage(direction){
      index=(index+direction+announcements.length)%announcements.length;
      showAnnouncement(true);
    }
    trigger.addEventListener('click',event=>{
      event.preventDefault();
      if(suppressTap){suppressTap=false;return;}
      openInfo();
    });
    trigger.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
      event.preventDefault();stepMessage(event.key==='ArrowRight'?1:-1);
    });
    trigger.addEventListener('pointerdown',event=>{
      if(event.button!==0 || drag)return;
      suppressTap=false;drag={id:event.pointerId,x:event.clientX,y:event.clientY,last:event.clientX,active:false};
      clearTimeout(timer);animation?.pause();
    });
    trigger.addEventListener('pointermove',event=>{
      if(!drag || drag.id!==event.pointerId)return;
      const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
      if(!drag.active){
        if(Math.max(Math.abs(dx),Math.abs(dy))<8)return;
        if(Math.abs(dy)>Math.abs(dx)){drag=null;suppressTap=true;showAnnouncement();return;}
        drag.active=true;suppressTap=true;trigger.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      const distance=event.clientX-drag.last;
      const steps=Math.trunc(distance/48);
      if(steps){drag.last+=steps*48;for(let n=0;n<Math.abs(steps);n++)stepMessage(steps<0?1:-1);}
    });
    function endDrag(event){
      if(!drag || drag.id!==event.pointerId)return;
      drag=null;
      if(trigger.hasPointerCapture(event.pointerId))trigger.releasePointerCapture(event.pointerId);
      showAnnouncement(true);
    }
    trigger.addEventListener('pointerup',endDrag);
    trigger.addEventListener('pointercancel',event=>{suppressTap=true;endDrag(event);});
    trigger.addEventListener('lostpointercapture',()=>{if(drag){drag=null;showAnnouncement(true);}});
    trigger.addEventListener('dragstart',event=>event.preventDefault());
    ticker.addEventListener('pointerenter', showAnnouncement);
    ticker.addEventListener('pointerleave', showAnnouncement);
    ticker.addEventListener('focusin', showAnnouncement);
    ticker.addEventListener('focusout', () => requestAnimationFrame(showAnnouncement));
    reducedMotion.addEventListener('change', () => {
      pause.hidden = reducedMotion.matches;
      showAnnouncement();
    });
    document.addEventListener('visibilitychange', showAnnouncement);
    new MutationObserver(showAnnouncement).observe(document.body, {attributes: true, attributeFilter: ['class']});
    new ResizeObserver(showAnnouncement).observe(viewport);
    pause.hidden = reducedMotion.matches;
    if(location.hash==='#application-info')openInfo(false);
  });
})();
