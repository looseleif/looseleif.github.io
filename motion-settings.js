(() => {
  // Tune here in response to chat feedback, without adding controls to the site.
  const settings = {
    speed: 1,
    overrides: {},
    rateFor(source) {
      return (this.overrides[source] ?? window.portfolioSemantics?.[source]?.playbackRate ?? 0.65) * this.speed;
    },
    configure(video, source) {
      video.controls = false;
      video.removeAttribute('controls');
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.disablePictureInPicture = true;
      video.defaultPlaybackRate = this.rateFor(source);
      video.playbackRate = video.defaultPlaybackRate;
      video.addEventListener('error', () => this.fallback(video, source));
    },
    fallback(video, source) {
      if (!video.isConnected || video.dataset.fallback) return;
      const original = (window.portfolioProjects || []).flatMap(p => p.media)
        .find(item => item.kind === 'video' && item.src === source)?.original;
      if (!original) return;
      const image = document.createElement('img');
      image.className = 'motion-fallback';
      image.src = original;
      image.alt = video.getAttribute('aria-label') || 'Project demonstration';
      video.dataset.fallback = 'true';video.hidden = true;
      video.after(image);
    },
    play(video) {
      if (!video.paused || video.dataset.fallback) return;
      video.play().catch(error => {
        // An intentional pause during navigation can abort an in-flight play.
        if (error.name !== 'AbortError') this.fallback(video, video.dataset.src || video.getAttribute('src'));
      });
    }
  };
  window.portfolioMotion = settings;
})();
