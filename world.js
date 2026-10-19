(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const stars = document.querySelector('.starfield');
  let seed=971837;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
  for(let i=0;stars&&i<120;i++){const star=document.createElement('i');star.className='star';star.style.left=random()*100+'%';star.style.top=random()*100+'%';const size=.6+random()*1.7;star.style.width=star.style.height=size+'px';star.style.opacity=.2+random()*.65;star.style.animationDelay=-random()*13+'s';stars.appendChild(star);}
  const orbit = document.querySelector('.project-orbit');
  if (!orbit) return;
  const scene = document.querySelector('.world-scene');
  const planets = [...orbit.querySelectorAll('.project-planet')];
  const globe = document.querySelector('.world-globe');
  const track = document.querySelector('#preview-track');
  const projectStrip = document.querySelector('.project-strip');
  const projectButtons = [...document.querySelectorAll('[data-project]')];
  const step = Math.PI * 2 / planets.length;
  let angle = 0, targetAngle = 0, gesture = null, moved = false, open = true;
  let selected = -1, animation = 0;
  const touchPointers=new Set();
  let suppressOrbitClick=false;
  // Previews describe the current project directions and link to readable pages.
  const previews = [
    {name:'1AGE Page', description:'Your identity across 1AGE.', cards:[
      ['Identity','One profile across the ecosystem','Profiles and a persistent identity are in development.','/ecosystem/#page'],
      ['Messages','A place for direct connection','Messaging is part of the 1AGE Page direction.','/ecosystem/#page'],
      ['Personal rooms','A place of your own','Customizable personal World rooms are planned.','/world/']]},
    {name:'1AGE Space', description:'A social destination for the Solana community.', cards:[
      ['Social','Meet through 1AGE Space','The Solana social network is in development.','/ecosystem/#space'],
      ['World','A shared social environment','A connected gathering place is planned inside World.','/world/'],
      ['Development','Follow the ecosystem taking shape','Read the latest published development notes.','/updates/']]},
    {name:'1AGE Games', description:'Discover games and follow new worlds in development.', cards:[
      ['No Name Besuto','Train. Explore. Build your fighter.','The in-house fighter lifestyle game is in development.','/ecosystem/#games'],
      ['Discovery','Find your next game','Explore the gaming direction and the growing Solana directory.','/ecosystem/#games'],
      ['1AGEWorld','Movement that feels like play','Walking, flying and touch controls work in the native environment.','/world/']]},
    {name:'1AGE Exchange', description:'Commerce and payments across the ecosystem.', cards:[
      ['Marketplace','A place to exchange','The marketplace is in development, connected to 1AGE Page identity.','/ecosystem/#exchange'],
      ['1AGE Pay','One checkout direction','Ecosystem payments are planned through 1AGE Exchange.','/plus/'],
      ['Membership','1AGE Plus is taking shape','Learn about the membership direction. Payments are not open yet.','/plus/']]},
    {name:'1AGE Quest', description:'Learn, participate and contribute.', cards:[
      ['Learning','Explore something new','Interactive learning is part of the Quest direction.','/ecosystem/#quest'],
      ['Participation','Discover ways to contribute','Quest experiences and participation tools are in development.','/ecosystem/#quest'],
      ['Discovery','Get to know the ecosystem','Browse the current collection of Solana projects and tools.','/directory/']]},
    {name:'1AGE Cash', description:'Building 1AGE should feel like playing 1AGE.', cards:[
      ['1AGE.Desktop','Your cosmic workspace','The installed creator home shares the visual language of World.','/ecosystem/#design'],
      ['1AGEWorld','Walk. Fly. Create.','The working World foundation runs on ThinkPad and Chuwi.','/world/'],
      ['Development','See what is being built','Follow progress across the web and native creator environment.','/updates/']]}
  ];
  function showPreview(index) {
    window.dispatchEvent?.(new CustomEvent('1age-project-preview',{detail:index}));
    if (selected === index) return;
    selected = index;
    projectButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.project) === index)));
    planets.forEach((planet, i) => {
      planet.classList.toggle('is-selected', i === index);
      planet.setAttribute('aria-label', `Explore ${previews[i].name}${i === index ? ', selected preview' : ''}`);
    });
    if (!track) return;
    const project = previews[index];
    document.querySelector('#preview-title').textContent = project.name;
    document.querySelector('#preview-description').textContent = project.description;
    track.replaceChildren();
    project.cards.forEach(([category, title, description, href]) => {
      const card = document.createElement('a'); card.className = 'preview-card'; card.href = href;
      card.style.setProperty('--accent', planets[index].style.getPropertyValue('--accent'));
      const visual = document.createElement('div'); visual.className = 'preview-art';
      visual.setAttribute('aria-hidden', 'true'); visual.appendChild(planets[index].querySelector('svg').cloneNode(true));
      const eyebrow = document.createElement('span'); eyebrow.className = 'eyebrow'; eyebrow.textContent = category;
      const heading = document.createElement('h3'); heading.textContent = title;
      const copy = document.createElement('p'); copy.textContent = description;
      const link = document.createElement('span'); link.className = 'text-link'; link.textContent = 'Explore ↗';
      card.append(visual, eyebrow, heading, copy, link); track.appendChild(card);
    });
    track.scrollLeft = 0;
  }
  function nearestIndex(value) {
    return ((Math.round((Math.PI - value) / step) % planets.length) + planets.length) % planets.length;
  }
  function layout() {
    const rx = orbit.clientWidth / 2, ry = orbit.clientHeight / 2;
    planets.forEach((planet, i) => {
      const a = -Math.PI / 2 + i * step + angle;
      planet.dataset.upper=String(Math.sin(a)<-.2);
      const compact=window.matchMedia('(orientation:landscape) and (max-height:600px)').matches;
      const concealed=compact&&Math.abs(Math.cos(a)*rx)<globe.clientWidth/2+orbit.clientHeight*.10+12;planet.dataset.concealed=String(concealed);planet.tabIndex=concealed?-1:0;planet.setAttribute('aria-hidden',String(concealed));
      planet.style.setProperty('--x', `${Math.cos(a) * rx}px`);
      planet.style.setProperty('--y', `${Math.sin(a) * ry}px`);
    });
  }
  function snap(screenDirection) {
    if (!open) return;
    // At the front/bottom of the orbit, move planets in the arrow's screen direction.
    const direction = -screenDirection;
    cancelAnimationFrame(animation);
    const basis = gesture ? angle : targetAngle;
    targetAngle = direction > 0 ? (Math.floor(basis / step + .00001) + 1) * step
                               : (Math.ceil(basis / step - .00001) - 1) * step;
    gesture = null;
    animateTo(targetAngle);
  }
  function animateTo(destination) {
    cancelAnimationFrame(animation);
    targetAngle = destination;
    const from = angle, to = targetAngle, started = performance.now();
    showPreview(nearestIndex(to));
    function tick(now) {
      const t = reduced.matches ? 1 : Math.min(1, (now - started) / 550);
      angle = from + (to - from) * (1 - Math.pow(1 - t, 3)); layout();
      if (t < 1) animation = requestAnimationFrame(tick);
    }
    animation = requestAnimationFrame(tick);
  }
  function pointAngle(event) {
    const box = orbit.getBoundingClientRect();
    return Math.atan2((event.clientY - box.top - box.height / 2) / (box.height / 2),
                      (event.clientX - box.left - box.width / 2) / (box.width / 2));
  }
  scene.addEventListener('pointerdown', event => {
    suppressOrbitClick=false;
    if(event.pointerType==='touch') {
      touchPointers.add(event.pointerId);
      if(touchPointers.size>1){suppressOrbitClick=true;cancel();return;}
    }
    if (event.button !== 0 || !open || gesture || event.target.closest('.world-globe') || event.target.closest('.world-entry') || event.target.closest('.console-controls,.side-menu,.preview-expand')) return;
    const link = event.target.closest('.project-planet');
    const box = orbit.getBoundingClientRect();
    const radius = Math.hypot((event.clientX-box.left-box.width/2)/(box.width/2),
                              (event.clientY-box.top-box.height/2)/(box.height/2));
    if (!link && (radius < .72 || radius > 1.30)) return;
    cancelAnimationFrame(animation); moved = false;
    gesture = {id:event.pointerId, x:event.clientX, y:event.clientY, last:pointAngle(event), pending:0, link,touch:event.pointerType==='touch'};
    scene.setPointerCapture(event.pointerId);
  });
  scene.addEventListener('pointermove', event => {
    if (!gesture || event.pointerId !== gesture.id) return;
    const now = pointAngle(event);
    gesture.pending += Math.atan2(Math.sin(now-gesture.last), Math.cos(now-gesture.last));
    gesture.last = now;
    if (Math.hypot(event.clientX-gesture.x,event.clientY-gesture.y)>10) moved = true;
    if (moved) { angle += gesture.pending; gesture.pending = 0; targetAngle = angle; layout(); }
  });
  scene.addEventListener('pointerup', event => {
    if(event.pointerType==='touch')touchPointers.delete(event.pointerId);
    if (!gesture || event.pointerId !== gesture.id) return;
    const link = gesture.link; gesture = null;
    suppressOrbitClick=true;
    if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    if (!moved && link && !link.dataset.held) window.location.assign(link.href);
    else if (moved) showPreview(nearestIndex(angle));
  });
  function cancel() { gesture = null; moved = true; targetAngle = angle; }
  scene.addEventListener('pointercancel', event=>{touchPointers.delete(event.pointerId);suppressOrbitClick=true;cancel();});
  scene.addEventListener('lostpointercapture', () => { gesture = null; });
  orbit.addEventListener('dragstart',event=>event.preventDefault());
  orbit.addEventListener('click', event => {
    if(event.detail>0&&suppressOrbitClick){event.preventDefault();suppressOrbitClick=false;return;}
    const link=event.target?.closest('.project-planet');
    if(link){event.preventDefault();if(!link.dataset.held)window.location.assign(link.href);}
  });
  window.addEventListener('1age-orbit-step',e=>snap(e.detail));
  orbit.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault(); snap(event.key === 'ArrowLeft' ? -1 : 1);
  });
  document.querySelectorAll('[data-preview-step]').forEach(button => button.addEventListener('click', () => {
    const card = track.querySelector('.preview-card');
    const gap = Number.parseFloat(window.getComputedStyle?.(track)?.columnGap) || 24;
    track.scrollBy({left:Number(button.dataset.previewStep) * (card.getBoundingClientRect().width + gap), behavior:reduced.matches?'instant':'smooth'});
  }));
  projectButtons.forEach(button => button.addEventListener('click', () => {
    open=true;orbit.hidden=false;globe.setAttribute('aria-expanded','true');
    document.querySelectorAll('[data-rotate]').forEach(arrow => {arrow.disabled=false;});
    const index = Number(button.dataset.project);
    const desired = Math.PI-index*step;
    const shortest = Math.atan2(Math.sin(desired-angle), Math.cos(desired-angle));
    animateTo(angle+shortest);
  }));
  function dragScroll(node) {
    if (!node) return;
    let pointer = null, suppressClick = false;
    node.addEventListener('dragstart', event => event.preventDefault());
    node.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.pointerType === 'touch') return;
      pointer = {id:event.pointerId,x:event.clientX,scroll:node.scrollLeft,dragging:false};
      suppressClick = false;
    });
    node.addEventListener('pointermove', event => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const distance = event.clientX-pointer.x;
      if (!pointer.dragging && Math.abs(distance)>8) {
        pointer.dragging = true; node.classList.add('is-dragging'); node.setPointerCapture(event.pointerId);
      }
      if (pointer.dragging) {event.preventDefault();node.scrollLeft=pointer.scroll-distance;}
    });
    function release(event) {
      if (!pointer || event.pointerId !== pointer.id) return;
      suppressClick = pointer.dragging; pointer = null; node.classList.remove('is-dragging');
      if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    }
    node.addEventListener('pointerup', release);
    node.addEventListener('pointercancel', release);
    node.addEventListener('lostpointercapture', () => {pointer=null;node.classList.remove('is-dragging');});
    node.addEventListener('click', event => {
      if (suppressClick) {event.preventDefault();event.stopPropagation();suppressClick=false;}
    }, true);
    node.addEventListener('keydown', event => {
      if (event.key!=='ArrowLeft' && event.key!=='ArrowRight') return;
      event.preventDefault();
      node.scrollBy({left:(event.key==='ArrowLeft'?-1:1)*node.clientWidth*.65,behavior:reduced.matches?'instant':'smooth'});
    });
  }
  dragScroll(track);dragScroll(projectStrip);
  const worldDialog = document.querySelector('#world-entry-dialog');
  document.querySelectorAll('[data-enter-world]').forEach(button => button.addEventListener('click', () => {
    if (worldDialog?.showModal) worldDialog.showModal();
    else window.location.assign('/world/#desktop-entry');
  }));
  document.querySelector('[data-browse-projects]')?.addEventListener('click', () => {
    worldDialog.close();
    if (projectStrip) {
      projectStrip.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});
      projectStrip.focus({preventScroll:true});
    } else {
      open=true;orbit.hidden=false;globe.setAttribute('aria-expanded','true');
      document.querySelectorAll('[data-rotate]').forEach(arrow => {arrow.disabled=false;});
      orbit.focus({preventScroll:true});
    }
  });
  new ResizeObserver(layout).observe(orbit); layout(); showPreview(nearestIndex(angle));
  const texture = document.querySelector('.globe-texture');
  // Project one continuous world map onto the sphere. No atlas handoff or fade.
  function movingGlobe() {
    const canvas = document.createElement('canvas');
    if (!canvas.getContext || !window.Image) return null;
    const context = canvas.getContext('2d');
    if (!context) return null;
    canvas.width = canvas.height = 336;
    canvas.className = 'globe-texture'; canvas.style.backgroundImage = 'none';
    canvas.style.width = canvas.style.height = '100%';
    canvas.setAttribute('aria-hidden', 'true');
    const strip = document.createElement('canvas'), stripContext=strip.getContext('2d');
    if (!stripContext) return null;
    const image = new window.Image(); let ready = false;
    image.onload = () => {
      strip.width=image.width*3;strip.height=image.height;
      for(let i=0;i<3;i++) stripContext.drawImage(image,i*image.width,0);
      ready=true;texture.after(canvas);texture.hidden=true;render(0);
    };
    image.src = '/assets/world-surface.png';
    const tiles=[];
    for(let row=0;row<32;row++) {
      const top=-1+row/16,bottom=-1+(row+1)/16;
      const limit=Math.sqrt(Math.max(0,1-((top+bottom)/2)**2));
      const v1=.5+Math.asin(top)/Math.PI,v2=.5+Math.asin(bottom)/Math.PI;
      for(let column=0;column<24;column++) {
        const a=-Math.PI/2+column*Math.PI/24,b=-Math.PI/2+(column+1)*Math.PI/24;
        tiles.push({left:limit*Math.sin(a),right:limit*Math.sin(b),top,bottom,
          u:1+a/(Math.PI*2),du:(b-a)/(Math.PI*2),v:v1,dv:v2-v1});
      }
    }
    function render(turn) {
      if (!ready) return false;
      context.clearRect(0,0,336,336);
      context.save();context.beginPath();context.arc(168,168,168,0,Math.PI*2);context.clip();
      context.fillStyle='#000';context.fillRect(0,0,336,336);
      for(const tile of tiles) context.drawImage(strip,(tile.u+turn)*image.width,tile.v*image.height,
        tile.du*image.width,tile.dv*image.height,
        (1+tile.left)*168-.3,(1+tile.top)*168-.3,(tile.right-tile.left)*168+.6,(tile.bottom-tile.top)*168+.6);
      context.restore();return true;
    }
    return render;
  }
  const renderSurface = movingGlobe();
  let elapsed = 0, last = performance.now(),manualTurn=0;
  window.addEventListener?.('1age-world-turn',event=>{manualTurn+=event.detail;});
  window.setInterval(() => {
    const now = performance.now(), delta = Math.min(.25, (now-last)/1000); last = now;
    if (document.hidden) return;
    if(!reduced.matches)elapsed += delta;
    const turn = ((elapsed / 120 + manualTurn)%1+1)%1;
    const lettering=document.querySelector('.world-letter');
    if(lettering){if(!lettering.children.length){lettering.textContent='';for(const char of '1AGE WORLD'){const span=document.createElement('b');span.textContent=char===' '?'\u00a0':char;lettering.appendChild(span);}}[...lettering.children].forEach((letter,i)=>{const phase=-turn*Math.PI*2+(i-4.5)*.18,depth=Math.cos(phase);letter.style.transform=`translate(-50%,-50%) translateX(${Math.sin(phase)*globe.clientWidth*.46}px) scaleX(${Math.max(.04,depth)})`;letter.style.opacity=depth>.04?'1':'0';});}
    if (renderSurface && renderSurface(turn)) return;
    texture.style.backgroundPosition = `${turn*100}% center`;
  }, 33);
})();
