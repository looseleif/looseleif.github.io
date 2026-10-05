(() => {
  const reels = [];
  let galleryOpen = false;
  document.querySelectorAll('.project-reel').forEach(reel => {
    const slides = [...reel.querySelectorAll('.reel-slide')];
    reel.querySelector('.reel-controls')?.remove();
    if (slides.length < 2) return;
    let index = 0, visible = false, timer, touchX;
    const showcase = reel.closest('.system-slide');
    let visited = !showcase?.hidden;
    const progress = document.createElement('span');
    progress.className = 'reel-progress';
    progress.setAttribute('aria-hidden', 'true');
    reel.append(progress);
    const restart = () => {
      clearTimeout(timer);
      reel.classList.remove('is-cycling');
      if (showcase || !visible || galleryOpen || document.hidden) return;
      const delay = 2000 + Math.random() * 2000;
      reel.style.setProperty('--reel-duration', `${delay}ms`);
      reel.dataset.nextDelay = String(Math.round(delay));
      void progress.offsetWidth;
      reel.classList.add('is-cycling');
      timer = setTimeout(() => show(index + 1), delay);
    };
    const show = next => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => { slide.hidden = i !== index; });
      reel.dispatchEvent(new CustomEvent('portfolio:frame'));
      const nextImage = slides[(index + 1) % slides.length].querySelector('img');
      if (nextImage) nextImage.loading = 'eager';
      restart();
    };
    // Hover and restored focus never strand a gallery on a still frame.
    reel.addEventListener('touchstart', event => { touchX = event.touches[0].clientX; }, { passive: true });
    reel.addEventListener('touchend', event => {
      if (touchX === undefined) return;
      const distance = event.changedTouches[0].clientX - touchX;
      if (Math.abs(distance) > 45) show(index + (distance < 0 ? 1 : -1));
      touchX = undefined;
    }, { passive: true });
    new IntersectionObserver(entries => {
      const nextVisible = entries[0].isIntersecting;
      if (visible !== nextVisible) { visible = nextVisible;restart(); }
    }, { threshold: 0 }).observe(reel);
    if (showcase) document.addEventListener('portfolio:system', () => {
      if (showcase.hidden) return;
      if (visited) show(index + 1);
      else { visited = true;show(index); }
    });
    const box = reel.getBoundingClientRect();
    visible = box.width > 0 && box.bottom > 0 && box.top < innerHeight;
    restart();
    reels.push(restart);
  });
  const restartAll = () => reels.forEach(restart => restart());
  document.addEventListener('portfolio:gallery', event => { galleryOpen = event.detail.open; restartAll(); });
  document.addEventListener('visibilitychange', restartAll);
})();
