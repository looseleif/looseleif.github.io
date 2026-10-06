(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = [];
  let galleryOpen = false;
  const time = value => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
  const sync = state => {
    if (state.visible && !state.video.closest('[hidden]') && !state.manualPause && !reduced.matches && !galleryOpen && !document.hidden) {
      if (state.video.paused) state.video.play().catch(() => {});
    } else state.video.pause();
  };
  document.querySelectorAll('.clip-player').forEach(player => {
    const video = player.querySelector('video');
    const controls = player.querySelector('.clip-controls');
    const slider = player.querySelector('.clip-seek');
    const toggle = player.querySelector('.clip-toggle');
    const output = player.querySelector('.clip-time');
    const state = { video, visible: false, manualPause: false };
    states.push(state);
    controls.hidden = false;
    video.controls = false;video.defaultMuted = true;video.muted = true;video.playsInline = true;
    const semantics = (window.portfolioSemantics || {})[video.getAttribute('src')];
    const rate = semantics?.playbackRate || 0.65;
    video.defaultPlaybackRate = rate;
    video.playbackRate = rate;
    const speed = document.createElement('select');
    speed.className = 'clip-speed';
    speed.setAttribute('aria-label', 'Playback speed');
    [0.25, 0.5, 0.65, 1].forEach(value => {
      const option = document.createElement('option');
      option.value = value; option.textContent = `${value}x`; option.selected = value === rate;
      speed.append(option);
    });
    controls.append(speed);
    speed.addEventListener('change', () => { video.playbackRate = Number(speed.value); });
    const cues = semantics?.scenes || [];
    const caption = player.querySelector('figcaption > span');
    const defaultCaption = semantics?.summary || caption.textContent;
    const chapters = document.createElement('div');
    if (cues.length > 1) {
      chapters.className = 'clip-chapters';
      const label = document.createElement('label');
      label.textContent = 'In this clip';
      const select = document.createElement('select');
      select.setAttribute('aria-label', 'Jump to annotated scene');
      cues.forEach(cue => {
        const option = document.createElement('option');
        option.value = cue.start; option.textContent = cue.title;
        select.append(option);
      });
      select.addEventListener('change', () => seek(Number(select.value)));
      label.append(select); chapters.append(label); player.append(chapters);
    }
    const update = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      slider.max = duration || 100;
      slider.disabled = !duration;
      slider.value = video.currentTime;
      slider.setAttribute('aria-valuetext', `${time(video.currentTime)} of ${time(duration)}`);
      output.textContent = `${time(video.currentTime)} / ${time(duration)}`;
      toggle.textContent = video.paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', video.paused ? 'Play clip' : 'Pause clip');
      const cue = cues.find(cue => video.currentTime >= cue.start && video.currentTime < cue.end);
      caption.textContent = cue ? cue.caption : defaultCaption;
      const chapterSelect = chapters.querySelector('select');
      if (chapterSelect && cue) chapterSelect.value = cue.start;
    };
    ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause'].forEach(event => video.addEventListener(event, update));
    toggle.addEventListener('click', () => {
      if (video.paused) { state.manualPause = false; video.play().catch(() => {}); }
      else { state.manualPause = true; video.pause(); }
    });
    const seek = value => {
      if (!Number.isFinite(video.duration)) return;
      state.manualPause = true;
      video.pause();
      const target = Math.max(0, Math.min(value, video.duration));
      const applySeek = () => { video.currentTime = target; update(); };
      const seekableEnd = video.seekable.length ? video.seekable.end(video.seekable.length - 1) : 0;
      if (target > seekableEnd + 0.01) {
        // Metadata-only loading can expose duration before a usable seek range.
        video.preload = 'auto';
        video.addEventListener('loadeddata', applySeek, { once: true });
        video.load();
      } else applySeek();
    };
    slider.addEventListener('input', () => seek(Number(slider.value)));
    player.addEventListener('portfolio:seek', event => seek(event.detail.time));
    slider.addEventListener('wheel', event => {
      if (document.activeElement !== slider || !Number.isFinite(video.duration)) return;
      event.preventDefault();
      seek(video.currentTime + Math.sign(event.deltaY || event.deltaX) * 0.1);
    }, { passive: false });
    video.addEventListener('error', () => {
      controls.hidden = true;
      video.controls = true;
      const hint = player.querySelector('.clip-hint');
      if (hint) hint.textContent = 'Use Larger view to open the video.';
    });
    new IntersectionObserver(entries => {
      state.visible = entries[0].isIntersecting;
      sync(state);
    }, { threshold: 0.12 }).observe(video);
    update();
  });
  document.addEventListener('portfolio:gallery', event => { galleryOpen = event.detail.open; states.forEach(sync); });
  document.addEventListener('visibilitychange', () => states.forEach(sync));
  document.addEventListener('portfolio:recording', () => states.forEach(state => {
    const box = state.video.getBoundingClientRect();
    state.visible = box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < innerHeight;
    sync(state);
  }));
  reduced.addEventListener('change', () => states.forEach(sync));
})();
