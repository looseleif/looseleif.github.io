(() => {
  const states = [];
  let galleryOpen = false;
  const sync = state => {
    if (state.visible && !state.video.closest('[hidden]') && !galleryOpen && !document.hidden) {
      window.portfolioMotion.play(state.video);
    } else state.video.pause();
  };
  document.querySelectorAll('.clip-player').forEach(player => {
    const video = player.querySelector('video');
    player.querySelectorAll('.clip-controls,.clip-chapters,.clip-hint').forEach(el => el.remove());
    const source = video.getAttribute('src');
    window.portfolioMotion.configure(video, source);
    const state = { video, visible:false };
    states.push(state);
    const semantics = window.portfolioSemantics?.[source];
    const caption = player.querySelector('figcaption > span');
    const defaultCaption = semantics?.summary || caption?.textContent;
    video.addEventListener('timeupdate', () => {
      const cue = semantics?.scenes?.find(c => video.currentTime >= c.start && video.currentTime < c.end);
      if (caption) caption.textContent = cue?.caption || defaultCaption;
    });
    video.addEventListener('canplay', () => sync(state));
    new IntersectionObserver(entries => {
      state.visible = entries[0].isIntersecting;
      sync(state);
    }, { threshold:0.12 }).observe(video);
  });
  document.addEventListener('portfolio:gallery', event => { galleryOpen = event.detail.open;states.forEach(sync); });
  document.addEventListener('visibilitychange', () => states.forEach(sync));
  window.addEventListener('pageshow', () => states.forEach(sync));
  document.addEventListener('portfolio:recording', () => states.forEach(state => {
    const box = state.video.getBoundingClientRect();
    state.visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;
    sync(state);
  }));
})();
