(() => {
  const projects = window.portfolioProjects || [];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reducedMotion.matches;
  let dialogOpen = false;
  const loops = [...document.querySelectorAll('.project-loop')];
  const visible = new Set();
  function syncMotion() {
    loops.forEach(video => {
      if (!paused && !dialogOpen && !document.hidden && visible.has(video) && !video.closest('[hidden]')) {
        if (!video.getAttribute('src')) video.src = video.dataset.src;
        video.play().catch(() => {});
      } else video.pause();
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    syncMotion();
  }, { threshold: 0.12 });
  loops.forEach(video => {
    const rate = (window.portfolioSemantics || {})[video.dataset.src || video.getAttribute('src')]?.playbackRate || 0.65;
    video.defaultPlaybackRate = rate; video.playbackRate = rate; observer.observe(video);
  });
  const motionButton = document.querySelector('.motion-control');
  function updateMotionButton() {
    if (!motionButton) return;
    motionButton.textContent = paused ? 'Play motion ▷' : 'Pause motion Ⅱ';
    motionButton.setAttribute('aria-pressed', String(paused));
  }
  if (motionButton) {
    motionButton.hidden = false;
    updateMotionButton();
    motionButton.addEventListener('click', () => { paused = !paused; updateMotionButton(); syncMotion(); });
  }
  reducedMotion.addEventListener('change', event => { paused = event.matches; updateMotionButton(); syncMotion(); });
  document.addEventListener('visibilitychange', syncMotion);

  const filters = document.querySelector('.filters');
  if (filters) {
    filters.hidden = false;
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-filter]');
      if (!button) return;
      const category = button.dataset.filter;
      filters.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      let count = 0;
      document.querySelectorAll('[data-category]').forEach(item => {
        item.hidden = category !== 'All' && item.dataset.category !== category;
        if (!item.hidden) count++;
      });
      document.querySelector('.work-wall')?.classList.toggle('is-filtered', category !== 'All');
      document.querySelector('.filter-status').textContent = `${count} projects shown${category === 'All' ? '' : ': ' + category}.`;
      syncMotion();
    });
  }

  if (!document.querySelector('[data-project]')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'gallery-dialog';
  dialog.setAttribute('aria-labelledby', 'gallery-title');
  dialog.innerHTML = `<div class="gallery-header"><h2 id="gallery-title"></h2><button class="gallery-close" type="button" aria-label="Close gallery">Close ×</button></div><div class="gallery-stage"></div><div class="gallery-bottom"><div aria-live="polite"><p class="gallery-position"></p><p class="gallery-caption"></p><a class="gallery-details">Read the project story ↗</a></div><div class="gallery-navigation"><button class="gallery-prev" type="button" aria-label="Previous image or video">←</button><button class="gallery-next" type="button" aria-label="Next image or video">→</button></div></div>`;
  document.body.append(dialog);
  const originalLink = document.createElement('a');
  originalLink.className = 'gallery-original';
  originalLink.textContent = 'Open original ↗';
  originalLink.target = '_blank';
  originalLink.rel = 'noopener';
  dialog.querySelector('.gallery-details').after(originalLink);
  const yearControl = document.createElement('label');
  yearControl.className = 'gallery-year';
  yearControl.hidden = true;
  yearControl.append('Year');
  const yearSelect = document.createElement('select');
  yearSelect.setAttribute('aria-label', 'Event year');
  yearControl.append(yearSelect);
  dialog.querySelector('.gallery-header').after(yearControl);
  const stage = dialog.querySelector('.gallery-stage');
  let currentProject, index = 0, opener, seekTime = null;
  let activeIndices = [];
  function setYear(year) {
    activeIndices = currentProject.media.map((item, i) => ({ item, i }))
      .filter(({item}) => year === 'all' || item.year === year).map(({i}) => i);
    if (!activeIndices.includes(index)) index = activeIndices[0];
  }
  yearSelect.addEventListener('change', () => { setYear(yearSelect.value); render(); });
  function render() {
    stage.querySelector('video')?.pause();
    const item = currentProject.media[index];
    const element = document.createElement(item.kind === 'video' ? 'video' : 'img');
    element.src = item.src;
    originalLink.href = item.original || item.src;
    if (item.kind === 'video') {
      element.preload = 'auto';
      element.controls = true;
      element.defaultPlaybackRate = (window.portfolioSemantics || {})[item.src]?.playbackRate || 0.65;
      element.playbackRate = element.defaultPlaybackRate;
      element.loop = true;
      element.muted = true;
      element.playsInline = true;
      element.poster = item.poster;
      element.setAttribute('aria-label', item.caption);
      element.addEventListener('timeupdate', () => {
        const scenes = (window.portfolioSemantics || {})[item.src]?.scenes || [];
        const scene = scenes.find(cue => element.currentTime >= cue.start && element.currentTime < cue.end);
        dialog.querySelector('.gallery-caption').textContent = scene?.caption || item.caption;
      });
      if (seekTime !== null) {
        const requestedTime = seekTime;
        seekTime = null;
        element.addEventListener('loadeddata', () => {
          element.currentTime = Math.min(requestedTime, element.duration);
          if (!paused) element.play().catch(() => {});
        }, { once: true });
      }
    } else element.alt = item.caption;
    stage.replaceChildren(element);
    dialog.querySelector('#gallery-title').textContent = currentProject.title;
    dialog.querySelector('.gallery-caption').textContent = item.caption;
    dialog.querySelector('.gallery-position').textContent = `${String(activeIndices.indexOf(index) + 1).padStart(2, '0')} / ${String(activeIndices.length).padStart(2, '0')} / ${item.year ? item.year + ' / ' : ''}${item.kind === 'video' ? 'VIDEO' : 'IMAGE'}`;
    dialog.querySelector('.gallery-details').href = currentProject.page || `projects.html#${currentProject.id}`;
    dialog.querySelectorAll('.gallery-prev, .gallery-next').forEach(button => { button.disabled = activeIndices.length < 2; });
    if (item.kind === 'video' && !paused) element.play().catch(() => {});
  }
  function step(delta) { index = activeIndices[(activeIndices.indexOf(index) + delta + activeIndices.length) % activeIndices.length]; render(); }
  document.querySelectorAll('[data-project]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const project = projects.find(item => item.id === link.dataset.project);
    if (!project) return;
    event.preventDefault();
    currentProject = project;
    index = Number(link.dataset.index || 0);
    seekTime = null;
    const selected = project.media[index];
    if (selected.source) {
      const videoIndex = project.media.findIndex(item => item.kind === 'video' && item.src === selected.source);
      if (videoIndex >= 0) { index = videoIndex; seekTime = selected.timestamp || 0; }
    }
    const years = [...new Set(project.media.map(item => item.year).filter(Boolean))].sort().reverse();
    yearControl.hidden = years.length === 0;
    yearSelect.replaceChildren();
    [['all', 'All years'], ...years.map(year => [year, year])].forEach(([value, label]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = label;
      yearSelect.append(option);
    });
    setYear('all');
    opener = link;
    dialogOpen = true;
    document.dispatchEvent(new CustomEvent('portfolio:gallery', { detail: { open: true } }));
    syncMotion();
    render();
    document.body.classList.add('gallery-open');
    dialog.showModal();
    dialog.querySelector('.gallery-close').focus();
  }));
  dialog.querySelector('.gallery-navigation').remove();
  dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.gallery-details').addEventListener('click', () => {
    const target = document.getElementById(currentProject.id);
    if (target) {
      document.querySelector('[data-filter="All"]')?.click();
      dialog.close();
      requestAnimationFrame(() => target.scrollIntoView());
    }
  });
  dialog.addEventListener('keydown', event => {
    if (['VIDEO', 'INPUT', 'SELECT'].includes(event.target.tagName)) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1); }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    stage.querySelector('video')?.pause();
    stage.replaceChildren();
    dialogOpen = false;
    document.dispatchEvent(new CustomEvent('portfolio:gallery', { detail: { open: false } }));
    document.body.classList.remove('gallery-open');
    opener?.focus();
    syncMotion();
  });
})();
