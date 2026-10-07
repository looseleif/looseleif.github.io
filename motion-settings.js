(() => {
  const mediaRoot = new URL('.', document.currentScript.src);
  // Tune here in response to chat feedback, without adding controls to the site.
  const settings = {
    speed: 1.25,
    overrides: {},
    rateFor(source) {
      if (source?.startsWith('videos/remorse/')) return 1;
      return (this.overrides[source] ?? window.portfolioSemantics?.[source]?.playbackRate ?? 0.65) * this.speed;
    },
    configure(video, source) {
      video.dataset.motionSource = source;
      // Keep stable media/review IDs while refreshing the higher-quality encodes.
      if (source?.startsWith('videos/remorse/')) {
        const url = new URL(source, mediaRoot);url.searchParams.set('v','65');
        video.dataset.src = url.href;
        if (video.hasAttribute('src')) video.src = url.href;
      }
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
      const item = (window.portfolioProjects || []).flatMap(p => p.media)
        .find(item => item.kind === 'video' && item.src === source);
      const original = item?.original || item?.poster;
      if (!original) return;
      const image = document.createElement('img');
      image.className = 'motion-fallback';
      image.src = new URL(original, mediaRoot).href;
      image.alt = video.getAttribute('aria-label') || 'Project demonstration';
      video.dataset.fallback = 'true';video.hidden = true;
      video.after(image);
    },
    play(video) {
      if (!video.paused || video.dataset.fallback) return;
      video.play().catch(error => {
        // An intentional pause during navigation can abort an in-flight play.
        if (error.name !== 'AbortError') this.fallback(video, video.dataset.motionSource || video.dataset.src || video.getAttribute('src'));
      });
    }
  };
  window.portfolioMotion = settings;
})();
