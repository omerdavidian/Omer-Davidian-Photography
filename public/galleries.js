// Native crossfading galleries with the original slow photographic zoom.
document.querySelectorAll('.feature-gallery').forEach(gallery => {
  const slides = [...gallery.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 7000;
  let index = 0, zoomIn = true, motion, timer, visible = false, paused = reduced.matches;
  let focused = false, remaining = duration, started = 0;
  gallery.classList.add('animated-gallery');
  gallery.setAttribute('aria-roledescription', 'carousel');
  const controls = document.createElement('div');
  controls.className = 'gallery-controls';
  const button = (label, text) => {
    const element = document.createElement('button');
    element.type = 'button'; element.setAttribute('aria-label', label); element.textContent = text;
    return element;
  };
  const playback = button('Pause gallery slideshow', '\u2161');
  playback.className = 'gallery-playback';
  const dots = document.createElement('div');
  dots.className = 'gallery-dots';
  dots.setAttribute('role', 'group');
  dots.setAttribute('aria-label', 'Choose gallery photograph');
  const navigation = slides.map((slide, position) => {
    const dot = button(`Show gallery photograph ${position + 1} of ${slides.length}`, '');
    dot.className = 'gallery-dot';
    dot.addEventListener('click', () => show(position));
    dots.append(dot);
    return dot;
  });
  controls.append(dots, playback); gallery.after(controls);
  const running = () => visible && !paused && !focused && !document.hidden && !document.querySelector('dialog[open]');
  function sync() {
    if (timer) { remaining = Math.max(0, remaining - (performance.now() - started)); clearTimeout(timer); timer = undefined; }
    if (running()) {
      motion?.play(); started = performance.now(); timer = setTimeout(() => show(index + 1), remaining);
    } else motion?.pause();
    playback.textContent = paused ? '▷' : 'Ⅱ';
    playback.setAttribute('aria-label', paused ? 'Play gallery slideshow' : 'Pause gallery slideshow');
    playback.setAttribute('aria-pressed', String(paused));
  }
  function show(position) {
    clearTimeout(timer); timer = undefined;
    const outgoing = slides[index].querySelector('img');
    // Keep its last zoom frame while opacity fades, avoiding a reset flash.
    outgoing.style.transform = getComputedStyle(outgoing).transform;
    motion?.cancel();
    index = (position + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    const image = slides[index].querySelector('img');
    image.loading = 'eager';
    slides[(index + 1) % slides.length].querySelector('img').loading = 'eager';
    image.style.transform = 'scale(1)';
    motion = reduced.matches ? undefined : image.animate([
      {transform: `scale(${zoomIn ? 1 : 1.1})`},
      {transform: `scale(${zoomIn ? 1.1 : 1})`}
    ], {duration, fill: 'both', easing: 'linear'});
    zoomIn = !zoomIn;
    navigation.forEach((dot, position) => {
      dot.classList.toggle('is-active', position === index);
      if (position === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    remaining = duration; sync();
  }
  playback.addEventListener('click', () => { paused = !paused; sync(); });
  const region = gallery.parentElement;
  region.addEventListener('focusin', () => { focused = true; sync(); });
  region.addEventListener('focusout', event => { if (!region.contains(event.relatedTarget)) { focused = false; sync(); } });
  gallery.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); show(index + (event.key === 'ArrowRight' ? 1 : -1)); }
  });
  document.addEventListener('visibilitychange', sync);
  document.querySelector('#lightbox')?.addEventListener('close', sync);
  reduced.addEventListener('change', () => { paused = reduced.matches; show(index); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, {threshold: .15}).observe(gallery);
  show(0);
});
