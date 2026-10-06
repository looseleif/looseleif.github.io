(() => {
  const root = document.querySelector('.system-rotator');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[role=tab]')];
  const slides = [...root.querySelectorAll('.system-slide')];
  let index = 0, visible = false, galleryOpen = false, timer;
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
  const schedule = () => {
    clearTimeout(timer); root.classList.remove('is-running');
    if (!visible || document.hidden || galleryOpen) return;
    const durations = [...slides[index].querySelectorAll('.project-loop')].map(video => {
      const clip = (window.portfolioSemantics || {})[video.dataset.src];
      return clip ? (clip.duration / clip.playbackRate + 2) * 1000 : 0;
    });
    // Every visible recording gets time to finish at its actual playback speed.
    const delay = Math.max(12000, ...durations);
    root.style.setProperty('--system-duration', `${delay}ms`);
    root.dataset.nextDelay = String(Math.round(delay));
    void root.offsetWidth;
    root.classList.add('is-running');
    timer = setTimeout(() => show(index + 1), delay);
  };
  const show = next => {
    slides[index].querySelectorAll('video').forEach(video => { video.autoplay = false;video.pause(); });
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => { slide.hidden = i !== index; });
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    slides[index].querySelectorAll('.project-loop').forEach(video => { if (video.readyState) video.currentTime = 0; });
    highlightProject();
    document.dispatchEvent(new CustomEvent('portfolio:system'));
    schedule();
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
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('portfolio:gallery', event => { galleryOpen = event.detail.open; schedule(); });
  const box = root.getBoundingClientRect();
  highlightProject();
  visible = box.width > 0 && box.bottom > 0 && box.top < innerHeight;
  schedule();
})();
