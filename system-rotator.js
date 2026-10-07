(() => {
  const root = document.querySelector('.system-rotator');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role=tab]')];
  const slides = [...root.querySelectorAll('.system-slide')];
  let index = 0, visible = false, galleryOpen = false, timer, frame;
  let elapsed = 0, startedAt = 0, duration = 0, running = false;
  const progress = root.querySelector('.system-progress');
  const fill = document.createElement('span');
  fill.className = 'system-progress-fill';
  progress.replaceChildren(fill);
  const paint = () => {
    const current = elapsed + (running ? performance.now() - startedAt : 0);
    fill.style.transform = `scaleX(${Math.min(1, current / (duration || 1))})`;
  };
  const tick = () => { paint();if (running) frame = requestAnimationFrame(tick); };
  const highlightProject = () => {
    const id = slides[index].id.replace('system-', '');
    const project = (window.portfolioProjects || []).find(item => item.id === id);
    document.querySelectorAll('.project-directory-entry').forEach(link => {
      const current = link.getAttribute('href') === project?.page;
      link.classList.toggle('is-showcased', current);
      if (current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  };
  const schedule = (reset = false) => {
    clearTimeout(timer);cancelAnimationFrame(frame);
    if (running) elapsed += performance.now() - startedAt;
    running = false;root.classList.remove('is-running');
    if (reset || !duration) {
      duration = 6000;elapsed = 0;
      root.dataset.nextDelay = String(Math.round(duration));
    }
    const media = slides[index].querySelector('.composition-grid,.exhibit-stage');
    if (media && progress.parentElement !== media) media.append(progress);
    paint();
    if (!visible || document.hidden || galleryOpen) return;
    startedAt = performance.now();running = true;
    root.classList.add('is-running');
    tick();
    timer = setTimeout(() => show(index + 1), Math.max(0, duration - elapsed));
  };
  const show = next => {
    slides[index].querySelectorAll('video').forEach(video => { video.autoplay = false;video.pause(); });
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    slides[index].querySelectorAll('.project-loop').forEach(video => { if (video.readyState) video.currentTime = 0; });
    highlightProject();
    document.dispatchEvent(new CustomEvent('portfolio:system'));
    schedule(true);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => show(i));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = i + 1;
      if (event.key === 'ArrowLeft') next = i - 1;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); show(next); tabs[index].focus();
    });
  });
  // The presentation has no tab bar. Swipe moves between projects; autoplay resumes.
  let touchX;
  root.addEventListener('touchstart', event => { touchX = event.touches[0].clientX; }, { passive:true });
  root.addEventListener('touchend', event => {
    if (touchX === undefined) return;
    const dx = event.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 65 && !event.target.closest('.project-reel')) show(index + (dx < 0 ? 1 : -1));
    touchX = undefined;
  }, { passive:true });
  new IntersectionObserver(entries => {
    const nextVisible = entries[0].isIntersecting;
    if (visible !== nextVisible) { visible = nextVisible;schedule(); }
  }, { threshold: 0 }).observe(root);
  document.addEventListener('visibilitychange', () => schedule());
  document.addEventListener('portfolio:gallery', event => { galleryOpen = event.detail.open; schedule(); });
  const box = root.getBoundingClientRect();
  highlightProject();
  visible = box.width > 0 && box.bottom > 0 && box.top < innerHeight;
  schedule();
})();
