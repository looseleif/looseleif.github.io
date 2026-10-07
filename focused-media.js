(() => {
  const projects = window.portfolioProjects || [];
  const picks = window.focusedProjectPhotos || {};
  function reelFor(id, photosOverride) {
    const project = projects.find(p => p.id === id);
    const seen = new Set();
    const photos = (photosOverride || picks[id] || []).filter(photo => {
      const media = project?.media[photo.mediaIndex];
      const source = media?.duplicateOf || photo.originalSource || photo.displaySource;
      if (media?.archived || seen.has(source)) return false;
      seen.add(source);return true;
    });
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
      link.dataset.mediaView = 'image';
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
  // Each composition pairs a project-level view with distinct implementation details.
  const compositions = {
    socio: { layout:'session', picks:[5,9,4,8,11], videos:[5,null,4,8,null], areas:['hero','phone','trace','cue','watch'], labels:['Live transcription','Mobile companion','Speaker diarization','Haptic events','On the wrist'], caption:'A live session, its mobile companion, and the watch prototype: speech processing, speaker activity, and feedback in context.' },
    'sync-tank': { layout:'exhibit', picks:[0,5,12,4], areas:['hero','screen','feed','build'], labels:['Open Sauce 2026','Camera arm & ring light','SEE SEA TV / Generated captions','Shrimp City habitat'], caption:'Sync Tank at Open Sauce 2026: the complete exhibit, articulated camera arm and ring light, Shrimp City habitat, and aquarium footage with generated captions.' },
    aggro: { layout:'research', picks:[0,1,2,5], videos:[31,7,13,null], areas:['hero','simulation','masks','team'], labels:['Robot demonstration','Robot simulation','Search environments','Research group'], caption:'Physical robot tests alongside simulation and cluttered search environments.' },
    solar: { layout:'solar', areas:['hero','board','driver'], picks:[0,1,2], labels:['The team & vehicle','Telemetry electronics','Me driving'], caption:'My work with the Solar Vehicle Project: contributing to the team, designing telemetry electronics, and driving the vehicle.' },
    awear: { layout:'wearable', areas:['hero','case','wrist'], picks:[0,1,2], labels:['Assembled sensing board','Sensor enclosure','Wrist-worn prototype'], caption:'The cardiac monitor as built: populated electronics, the sensor opening in the enclosure, and placement on the wrist.' },
    'feedback-loop': { layout:'bench', picks:[0,2,4], videos:[17], areas:['hero','sensor','board'], labels:['Device demonstration','Sensor module','Bench electronics'], caption:'A working biology teaching device, with modular sensors, custom electronics, and a responsive light ring.' },
    'electric-drives': { layout:'drives', picks:[3,0,2,1], areas:['hero','drive','board','control'], labels:['Two-wheel prototype','Drivetrain assembly','Mountain board','Handheld control'], caption:'Ground-vehicle builds, from the two-wheel prototype to the mountain board drivetrain and rider controls.' }
  };
  function compositionFor(id) {
    const project = projects.find(p => p.id === id), config = compositions[id];
    if (!project || !config) return null;
    const figure = document.createElement('figure');
    figure.className = 'project-composition';
    figure.dataset.composition = id;
    figure.dataset.layout = config.layout;
    figure.setAttribute('aria-label', `${project.title}: overview and details`);
    const grid = document.createElement('div');grid.className = 'composition-grid';
    config.picks.forEach((pick, index) => {
      const photo = picks[id][pick];
      const videoIndex = config.videos?.[index];
      const clip = videoIndex != null ? project.media[videoIndex] : null;
      const link = document.createElement('a');link.className = 'composition-tile';
      link.style.gridArea = config.areas[index];
      link.dataset.project = id;link.dataset.index = clip ? videoIndex : photo.mediaIndex;
      link.href = clip?.src || photo.originalSource || photo.displaySource;
      if (!clip && photo.timestamp != null) link.dataset.start = photo.timestamp;
      if (!clip) link.dataset.mediaView = 'image';
      link.setAttribute('aria-label', `${clip ? 'Watch full demonstration' : 'Expand image'}: ${config.labels[index]}`);
      const media = document.createElement(clip ? 'video' : 'img');
      if (clip) {
        media.className = 'project-loop';media.dataset.src = clip.src;
        media.poster = photo.displaySource;media.defaultMuted = true;media.muted = true;media.loop = true;
        media.playsInline = true;media.preload = 'none';
        media.setAttribute('aria-label', clip.caption);
      } else {
        media.src = photo.displaySource;media.alt = photo.caption;
        media.style.objectPosition = photo.position || '50% 50%';
        if (photo.fit) media.style.objectFit = photo.fit;
        if (id === 'socio' && pick === 9) media.style.objectFit = 'contain';
        media.loading = 'lazy';media.decoding = 'async';
      }
      const label = document.createElement('span');label.className = 'composition-label';
      label.textContent = config.labels[index] + (clip ? ' / Expand clip' : '');
      if (!clip && photo.crop) {
        // Crop only the presentation; the expand link retains the original screenshot.
        const [x,y,w,h,sourceWidth,sourceHeight] = photo.crop;
        const ns = 'http://www.w3.org/2000/svg';
        const viewport = document.createElementNS(ns,'svg');
        viewport.setAttribute('viewBox',`${x} ${y} ${w} ${h}`);
        viewport.setAttribute('role','img');viewport.setAttribute('aria-label',photo.caption);
        viewport.classList.add('composition-crop');
        if (id === 'awear' && index === 0) viewport.setAttribute('preserveAspectRatio','xMidYMid slice');
        const source = document.createElementNS(ns,'image');
        source.setAttribute('href',photo.displaySource);
        source.setAttribute('width',sourceWidth);source.setAttribute('height',sourceHeight);
        const clipPath = document.createElementNS(ns,'clipPath');
        const cropId = `composition-crop-${id}-${index}`;
        clipPath.id = cropId;
        const rect = document.createElementNS(ns,'rect');
        for (const [key,value] of Object.entries({x,y,width:w,height:h})) rect.setAttribute(key,value);
        clipPath.append(rect);source.setAttribute('clip-path',`url(#${cropId})`);
        viewport.append(clipPath,source);link.classList.add('has-crop');link.append(viewport,label);
      } else { link.append(media,label); }
      grid.append(link);
    });
    const caption = document.createElement('figcaption');caption.textContent = config.caption;
    figure.append(grid,caption);return figure;
  }
  document.querySelectorAll('[data-showcase-project]').forEach(slot => {
    const composition = compositionFor(slot.dataset.showcaseProject);
    if (composition) slot.replaceWith(composition);
  });
  document.querySelectorAll('.system-slide').forEach(slide => {
    const composition = compositionFor(slide.id.replace('system-', ''));
    if (!composition) return;
    slide.querySelector('.exhibit-stage').replaceWith(composition);
    const description = slide.querySelector('.terminal-panel dd:last-of-type');
    if (description) description.textContent = composition.querySelector('figcaption').textContent;
  });
  document.querySelectorAll('.project-exhibit').forEach(card => {
    const id = card.id;
    const project = projects.find(project => project.id === id);
    if (!project) return;
    const reel = compositionFor(id);
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
    const hasClips = document.querySelector('main .clip-player video');
    const project = projects.find(p => p.id === id);
    const additional = hasClips ? project?.media.flatMap((media, index) => media.kind === 'image' && !media.source && !media.archived && !media.duplicateOf ? [{displaySource:media.src,originalSource:media.src,mediaIndex:index,caption:media.caption}] : []) : undefined;
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
  const projectPage = location.pathname.replace(/\/$/, '/index.html').split('/').pop();
  const currentProject = projects.find(project => project.page === projectPage || project.page === location.pathname.replace(/^\//, '').replace(/\/$/, '/index.html'));
  if (currentProject && document.querySelector('main')) {
    const collection = document.createElement('p');collection.className = 'project-photo-collection';
    const link = document.createElement('a');link.className = 'text-link';
    link.href = `${currentProject.id === 'socio' ? '../' : ''}photos.html?project=${encodeURIComponent(currentProject.id)}`;
    link.textContent = 'All project photos & videos';collection.append(link);
    document.querySelector('main').append(collection);
  }
  if (document.querySelector('.motion-section')) {
    document.querySelectorAll('.scene-strip').forEach(strip => strip.remove());
  }
})();
