// Recreate the original Slider Revolution timeline with native browser animation.
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const slides = [...hero.querySelectorAll('.hero-slide')];
  const pauseButton = hero.querySelector('[data-hero="pause"]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const segments = slides.map((slide,index) => {
    const button=document.createElement('button');button.type='button';button.className='hero-segment';
    button.setAttribute('aria-label',`Show ${slide.dataset.label} collection`);button.title=slide.dataset.label;
    button.innerHTML='<span class="hero-segment-track"><span class="hero-progress"></span></span>';
    button.addEventListener('click',()=>show(index));hero.querySelector('.hero-segments').append(button);return button;
  });
  let current = 0, paused = reducedMotion.matches, timer, startedAt, remaining;
  let animations = [], transition = 0;

  function layoutText() {
    const width = hero.clientWidth, height = hero.clientHeight;
    const mobile = width < 768;
    const start = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--content-start')) || 0;
    const scale = mobile ? Math.min(.42, width / 1000) : Math.min(1, height / 900, (width - start - 24) / 1000);
    for (const layer of hero.querySelectorAll('.hero-text-layer')) {
      layer.style.fontSize = `${90 * scale}px`;
      layer.style.left = `${mobile ? 24 : Math.max(start + 24, width / 2 + parseFloat(layer.dataset.x) * scale)}px`;
      layer.style.top = `${height * (mobile ? .42 : .5) + parseFloat(layer.dataset.y) * scale}px`;
    }
  }

  function schedule() {
    clearTimeout(timer);
    startedAt = performance.now();
    if (!paused && !document.hidden) timer = setTimeout(() => show(current + 1), remaining);
  }

  function updatePlayback() {
    const stopped = paused || document.hidden;
    for (const animation of animations) stopped ? animation.pause() : animation.play();
    pauseButton.querySelector('[data-hero-icon]').innerHTML=paused?'<path d="m9 5 10 7-10 7Z"/>':'<path d="M9 6v12M15 6v12"/>';
    pauseButton.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    pauseButton.setAttribute('aria-pressed', String(paused));
    hero.querySelector('#slide-count').setAttribute('aria-live', paused ? 'polite' : 'off');
    if (stopped) {
      clearTimeout(timer);
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
    } else schedule();
  }

  function show(index, initial = false) {
    const generation = ++transition;
    clearTimeout(timer);
    animations.forEach(animation => animation.cancel());
    animations = [];
    const previous = slides[current];
    current = (index + slides.length) % slides.length;
    const active = slides[current];
    slides.forEach(slide => {
      slide.inert = slide !== active;
      slide.querySelector('figcaption').style.visibility = slide === active ? 'visible' : 'hidden';
      slide.style.zIndex = slide === active ? '2' : '1';
      if (slide !== active && slide !== previous) slide.hidden = true;
    });
    active.hidden = false;
    slides[(current + 1) % slides.length].querySelector('img').loading = 'eager';
    if (previous !== active && !initial && !reducedMotion.matches) {
      const fade = previous.animate([{opacity: 1}, {opacity: 0}], {duration: 900, fill: 'forwards'});
      fade.finished.then(() => { if (generation === transition) previous.hidden = true; fade.cancel(); }).catch(() => {});
      active.animate([{opacity: 0}, {opacity: 1}], {duration: 900});
    } else if (previous !== active) previous.hidden = true;

    layoutText();
    const image = active.querySelector('img');
    const pan = Object.fromEntries([...image.dataset.panzoom.matchAll(/(\w+):([^;]+)/g)].map(m => [m[1], m[2]]));
    const startScale = Number(pan.ss || 100) / 100, endScale = Number(pan.se || 100) / 100;
    function transform(scale, offset = '0/0') {
      const [x, y] = offset.split('/').map(Number);
      return `translate(${x / 100 * (scale - 1) * hero.clientWidth / 2}px, ${y / 100 * (scale - 1) * hero.clientHeight / 2}px) scale(${scale})`;
    }
    if (!reducedMotion.matches) {
      animations.push(image.animate([
        {transform: transform(startScale, pan.os)},
        {transform: transform(endScale, pan.oe)}
      ], {duration: Number(pan.d || 10000), easing: 'linear', fill: 'both'}));
    }
    const occupied = new Set();
    const layers = [...active.querySelectorAll('.hero-text-layer')].sort((a,b) => Number(a.dataset.enter)-Number(b.dataset.enter));
    for (const layer of layers) {
      const position = `${layer.dataset.x}/${layer.dataset.y}`;
      layer.hidden = reducedMotion.matches && occupied.has(position);
      occupied.add(position);
      if (reducedMotion.matches) continue;
      const enter = Number(layer.dataset.enter), fadeIn = Number(layer.dataset.enterDuration);
      const leave = Number(layer.dataset.leave), fadeOut = Number(layer.dataset.leaveDuration);
      const duration = leave + fadeOut - enter;
      animations.push(layer.animate([
        {opacity: 0, transform: 'translateX(50px)', offset: 0, easing: 'ease-out'},
        {opacity: 1, transform: 'translateX(0)', offset: fadeIn / duration},
        {opacity: 1, transform: 'translateX(0)', offset: (leave - enter) / duration, easing: 'ease-in'},
        {opacity: 0, transform: 'translateX(0)', offset: 1}
      ], {delay: enter, duration, fill: 'both'}));
    }
    hero.querySelector('#slide-count').textContent = `${String(current+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    hero.querySelector('#hero-category').textContent=active.dataset.label;
    segments.forEach((button,index)=>{button.classList.toggle('is-active',index===current);if(index===current)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
    const progress=segments[current].querySelector('.hero-progress');
    if(!reducedMotion.matches)animations.push(progress.animate([{transform:'scaleX(0)'},{transform:'scaleX(1)'}],{duration:Number(active.dataset.duration||7000),fill:'both',easing:'linear'}));
    else progress.style.transform='scaleX(1)';
    remaining = Number(active.dataset.duration || 7000);
    startedAt = performance.now();
    updatePlayback();
  }

  hero.querySelector('[data-hero="prev"]').addEventListener('click', () => show(current - 1));
  hero.querySelector('[data-hero="next"]').addEventListener('click', () => show(current + 1));
  pauseButton.addEventListener('click', () => { paused = !paused; updatePlayback(); });
  document.addEventListener('visibilitychange', updatePlayback);
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; show(current, true); });
  window.addEventListener('resize', layoutText, {passive: true});
  show(0, true);
})();
