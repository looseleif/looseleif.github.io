(() => {
  const videos = [...document.querySelectorAll('[data-remorse-clip]')];
  const visible = new Set();
  const sync = () => videos.forEach(video => {
    if (!document.hidden && visible.has(video)) {
      if (!video.getAttribute('src')) video.src = video.dataset.src;
      window.portfolioMotion.play(video);
    } else video.pause();
  });
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    sync();
  }, { threshold:.05 });
  videos.forEach(video => {
    // Source keys stay relative to the portfolio root for shared speed settings.
    window.portfolioMotion.configure(video, video.dataset.source);
    video.loop = true;
    video.addEventListener('canplay', sync);
    observer.observe(video);
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pageshow', sync);
})();
