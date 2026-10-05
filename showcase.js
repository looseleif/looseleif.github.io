(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.scene-jump').forEach(button => {
    button.addEventListener('click', () => {
      const scope = button.closest('.work-card') || document;
      const video = [...scope.querySelectorAll('.clip-player video')].find(v => v.getAttribute('src') === button.dataset.source);
      if (!video) return;
      const player = video.closest('.clip-player');
      const seek = () => {
        player.dispatchEvent(new CustomEvent('portfolio:seek', { detail: { time: Number(button.dataset.time) } }));
        player.scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'center' });
        player.querySelector('.clip-seek').focus({ preventScroll: true });
      };
      if (video.readyState >= 2) seek();
      else {
        video.addEventListener('loadeddata', seek, { once: true });
        video.preload = 'auto';
        video.load();
      }
    });
  });
})();
