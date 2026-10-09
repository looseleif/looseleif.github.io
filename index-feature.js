(() => {
  const root = document.querySelector('[data-feature-rotator]');
  if (!root) return;
  const slides = [...root.querySelectorAll('.feature-slide')];
  const controls = root.querySelector('.feature-controls');
  const pause = root.querySelector('[data-feature-pause]');
  const count = root.querySelector('.feature-count');
  const status = root.querySelector('[data-feature-status]');
  const progress = root.querySelector('.feature-progress');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 7500;
  let current = 0, timer, startedAt = 0, elapsed = 0, running = false;
  let visible = false, paused = reduced.matches, focused = false, suspended = false, touchStart;

  controls.hidden = false;
  progress.hidden = false;
  root.dataset.interval = String(duration);
  count.setAttribute('role', 'status');
  count.setAttribute('aria-live', 'off');
  count.textContent = `01 / ${String(slides.length).padStart(2, '0')}`;

  function schedule(reset = false) {
    clearTimeout(timer);
    if (running) elapsed += performance.now() - startedAt;
    running = false;
    if (reset) elapsed = 0;
    progress.firstElementChild.style.transform = `scaleX(${Math.min(1, elapsed / duration)})`;
    progress.firstElementChild.style.transition = 'none';
    root.dataset.running = 'false';
    if (!visible || paused || focused || suspended || document.hidden) return;
    const remaining = Math.max(0, duration - elapsed);
    void progress.offsetWidth;
    progress.firstElementChild.style.transition = `transform ${remaining}ms linear`;
    progress.firstElementChild.style.transform = 'scaleX(1)';
    startedAt = performance.now();
    running = true;
    root.dataset.running = 'true';
    timer = setTimeout(() => show(current + 1), remaining);
  }

  function updatePause() {
    pause.textContent = paused ? 'Play' : 'Pause';
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Resume automatic project rotation' : 'Pause automatic project rotation');
  }

  function warmNext() {
    slides[(current + 1) % slides.length].querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
  }

  function show(next, manual = false) {
    current = (next + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const active = index === current;
      slide.hidden = !active;
      slide.inert = !active;
      if (active) slide.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
    });
    root.dataset.current = slides[current].dataset.feature;
    count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    slides[current].querySelectorAll('.feature-copy > p,.feature-copy h2,.feature-link').forEach(node => {
      window.typePortfolioText?.(node);
    });
    if (manual) {
      paused = true;
      updatePause();
      status.textContent = slides[current].getAttribute('aria-label');
    }
    warmNext();
    schedule(true);
  }

  root.querySelector('[data-feature-prev]').addEventListener('click', () => show(current - 1, true));
  root.querySelector('[data-feature-next]').addEventListener('click', () => show(current + 1, true));
  pause.addEventListener('click', () => {
    paused = !paused;
    // Explicitly resuming permits rotation even while this control retains focus.
    focused = false;
    updatePause();
    schedule();
  });
  root.addEventListener('focusin', () => { focused = true; schedule(); });
  root.addEventListener('focusout', () => {
    queueMicrotask(() => {
      focused = root.contains(document.activeElement);
      schedule();
    });
  });
  controls.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    show(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : current + (event.key === 'ArrowRight' ? 1 : -1), true);
  });
  root.querySelector('.feature-slides').addEventListener('touchstart', event => {
    const touch = event.touches[0];
    touchStart = {x:touch.clientX, y:touch.clientY};
  }, {passive:true});
  root.querySelector('.feature-slides').addEventListener('touchend', event => {
    if (!touchStart) return;
    const touch = event.changedTouches[0], dx = touch.clientX - touchStart.x, dy = touch.clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1), true);
  }, {passive:true});
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
    schedule();
  }, {threshold:0.25}).observe(root);
  document.addEventListener('visibilitychange', () => schedule());
  reduced.addEventListener('change', () => {
    if (reduced.matches) { paused = true; updatePause(); schedule(); }
  });
  window.addEventListener('pagehide', () => { suspended = true; schedule(); });
  window.addEventListener('pageshow', event => { if (event.persisted) { suspended = false; schedule(); } });
  root.dataset.current = slides[0].dataset.feature;
  updatePause();
  warmNext();
})();
