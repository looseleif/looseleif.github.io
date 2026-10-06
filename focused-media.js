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
      img.style.objectPosition = photo.position || '50% 50%';
      if (photo.fit) img.style.objectFit = photo.fit;
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
    const id = card.id;
    const project = projects.find(project => project.id === id);
    if (!project) return;
    const reel = reelFor(id);
    const copy = card.querySelector('.exhibit-copy');
    copy.classList.add('focused-copy');
    if (project.presentation) {
      const { field, contribution, context } = project.presentation;
      copy.querySelector('.eyebrow').textContent = field;
      copy.querySelector('h2 + p').textContent = contribution;
      const details = document.createElement('dl');
      details.className = 'work-context';
      context.forEach(([label, text]) => {
        const dt = document.createElement('dt');dt.textContent = label;
        const dd = document.createElement('dd');dd.textContent = text;
        details.append(dt, dd);
      });
      copy.querySelector('.exhibit-link').before(details);
      copy.querySelector('.exhibit-link').textContent = 'Explore the work';
    }
    card.classList.add('work-showcase');
    if (reel) card.replaceChildren(reel, copy);
    else if (id === 'socio') {
      const diagram = document.createElement('figure');
      diagram.className = 'concept-stage';
      diagram.setAttribute('aria-label', 'Socio product direction: conversation context, remorse, and wearable feedback');
      diagram.innerHTML = '<div class="concept-label">PRODUCT DIRECTION</div><div class="concept-wordmark">socio</div><div class="concept-flow"><div><span>INPUT</span><strong>Conversation</strong><small>Context &amp; speaker activity</small></div><div><span>PRODUCT</span><strong>remorse</strong><small>Conversational support</small></div><div><span>COMPANION</span><strong>Wearables</strong><small>Haptics &amp; feedback</small></div></div><figcaption>A product in development, connecting conversation context with wearable feedback.</figcaption>';
      card.replaceChildren(diagram, copy);
    }
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
