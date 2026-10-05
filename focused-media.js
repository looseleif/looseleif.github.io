(() => {
  const projects = window.portfolioProjects || [];
  const picks = window.focusedProjectPhotos || {};
  function reelFor(id, photosOverride) {
    const project = projects.find(p => p.id === id);
    const photos = photosOverride || picks[id];
    if (!project || !photos?.length) return null;
    const reel = document.createElement('section');
    reel.className = 'project-reel focused-reel';
    reel.setAttribute('aria-label', `${project.title} photos`);
    photos.forEach((photo, index) => {
      const figure = document.createElement('figure');
      figure.className = 'reel-slide'; figure.hidden = index !== 0;
      const link = document.createElement('a');
      link.href = photo.originalSource || photo.displaySource;
      link.dataset.project = id; link.dataset.index = photo.mediaIndex;
      if (photo.timestamp != null) link.dataset.start = photo.timestamp;
      link.setAttribute('aria-label', `Expand: ${photo.caption}`);
      const img = document.createElement('img');
      img.src = photo.displaySource; img.alt = photo.caption;
      img.loading = index ? 'lazy' : 'eager'; img.decoding = 'async';
      link.append(img);
      const caption = document.createElement('figcaption');caption.textContent = photo.caption;
      figure.append(link, caption);reel.append(figure);
    });
    return reel;
  }
  document.querySelectorAll('.system-slide').forEach(slide => {
    const reel = reelFor(slide.id.replace('system-', ''));
    if (!reel) return;
    slide.querySelector('.exhibit-stage').replaceWith(reel);
    const description = slide.querySelector('.terminal-panel dd:last-of-type');
    const syncCaption = () => {
      if (!description) return;
      const caption = reel.querySelector('.reel-slide:not([hidden]) figcaption');
      const text = caption.dataset.terminalText || caption.textContent;
      if (window.retypeProjectPanel) window.retypeProjectPanel(slide, text);
      else description.textContent = text;
    };
    reel.addEventListener('portfolio:frame', syncCaption); syncCaption();
  });
  document.querySelectorAll('.project-exhibit').forEach(card => {
    const id = card.querySelector('[data-project]')?.dataset.project;
    const reel = reelFor(id); if (!reel) return;
    const copy = card.querySelector('.exhibit-copy');
    copy.classList.add('focused-copy');
    card.replaceChildren(reel, copy);
  });
  document.querySelectorAll('.work-card').forEach(card => {
    const id = card.querySelector('[data-project]')?.dataset.project;
    const reel = reelFor(id); if (!reel) return;
    const sheet = card.querySelector('.project-sheet');
    // Retain every playable source clip in its own full-width row below the photos.
    const clips = sheet?.querySelector('.inline-clips');
    if (sheet) { sheet.replaceChildren(reel);sheet.className = 'project-sheet focused-sheet'; }
    if (clips) { clips.classList.add('focused-clips');card.append(clips); }
    card.querySelector('.scene-strip')?.remove();
  });
  document.querySelectorAll('.case-media .contact-sheet').forEach(sheet => {
    const id = sheet.querySelector('[data-project]')?.dataset.project;
    const hasClips = document.querySelector('.motion-section video');
    const project = projects.find(p => p.id === id);
    const additional = hasClips ? project?.media.flatMap((media, index) => media.kind === 'image' && !media.source ? [{displaySource:media.src,originalSource:media.src,mediaIndex:index,caption:media.caption}] : []) : undefined;
    const reel = reelFor(id, additional);
    if (!reel) {
      if (hasClips) sheet.closest('.case-media')?.remove();
      document.querySelectorAll('.scene-strip').forEach(strip => strip.remove());
      return;
    }
    if (hasClips) {
      const heading = sheet.closest('.case-media').querySelector('h2');
      if (heading) heading.textContent = 'Additional photos';
    }
    sheet.replaceWith(reel);
    document.querySelectorAll('.scene-strip').forEach(strip => strip.remove());
  });
  if (document.querySelector('.motion-section')) {
    document.querySelectorAll('.scene-strip').forEach(strip => strip.remove());
  }
})();
