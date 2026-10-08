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
    socio: { layout:'session', picks:[5,4,8], videos:[5,4,8], areas:['hero','detail','context'], labels:['Live transcription','Speaker diarization','Haptic events'], caption:'Live transcription, speaker activity, and haptic feedback during IYKYD field recordings.' },
    'sync-tank': { layout:'exhibit', picks:[0,5,12], areas:['hero','detail','context'], labels:['Open Sauce 2026','Camera arm & ring light','SEE SEA TV / Generated captions'], caption:'The Open Sauce exhibit, articulated camera arm and ring light, and aquarium footage with generated captions.' },
    aggro: { layout:'research', picks:[0,1,2], videos:[31,7,13], areas:['hero','detail','context'], labels:['Robot demonstration','Robot simulation','Search environments'], caption:'Physical robot tests alongside simulation and cluttered search environments.' },
    solar: { layout:'solar', areas:['hero','board','driver'], picks:[0,1,2], labels:['The team & vehicle','Telemetry electronics','Me driving'], caption:'My work with the Solar Vehicle Project: contributing to the team, designing telemetry electronics, and driving the vehicle.' },
    awear: { layout:'wearable', areas:['hero','case','wrist'], picks:[0,1,2], labels:['Assembled sensing board','Sensor enclosure','Wrist-worn prototype'], caption:'The cardiac monitor as built: populated electronics, the sensor opening in the enclosure, and placement on the wrist.' },
    'feedback-loop': { layout:'bench', picks:[0,2,4], videos:[17], areas:['hero','sensor','board'], labels:['Device demonstration','Sensor module','Bench electronics'], caption:'A working biology teaching device, with modular sensors, custom electronics, and a responsive light ring.' },
    'electric-drives': { layout:'drives', picks:[7,6,5,8], areas:['hero','drive','board','control'], labels:['My FPV build','Camera-equipped drone','Rover electronics','Drone field work'], caption:'FPV drone builds, camera integration, outdoor field setups, and rover control electronics.' }
  };
  // Keep the rotating Index easy to read: one main view and two supporting views.
  const indexCompositions = {
    'sync-tank': { picks:[0,5,12], labels:['Open Sauce 2026','Camera arm & ring light','SEE SEA TV / Generated captions'], caption:'The Open Sauce exhibit, articulated camera arm and ring light, and aquarium footage with generated captions.' },
    aggro: { picks:[0,1,2], videos:[31,7,13] },
    socio: { picks:[5,4,8], videos:[5,4,8], labels:['Live transcription','Speaker diarization','Haptic feedback events'], caption:'Live transcription, separate speaker activity, and haptic feedback events during IYKYD field recordings.' },
    'feedback-loop': { picks:[0,1,3], videos:[17], labels:['Device demonstration','Modules & connectors','Custom electronics'] },
    'electric-drives': { picks:[5,6,2], labels:['Rover electronics','FPV camera rig','Mountain board'] }
  };
  // Match column heights using the sources' actual proportions and caption heights.
  // The media itself keeps its natural aspect ratio, without padded or cropped frames.
  function fitComposition(grid, id) {
    const tiles = [...grid.children];
    let scheduled = false;
    const layout = () => {
      scheduled = false;
      const width = grid.clientWidth;
      if (!width) return;
      const gap = 8;
      const mobile = width < 560;
      const ratios = tiles.map(tile => Number(tile.dataset.ratio) || 1);
      tiles.forEach((tile, i) => { tile.style.gridArea = `media${i}`; });
      grid.style.gridTemplateRows = 'auto';
      if (mobile && ['research','session'].includes(grid.parentElement.dataset.layout)) {
        grid.style.gridTemplateColumns = 'minmax(0,1fr)';
        grid.style.gridTemplateAreas = tiles.map((_, i) => `"media${i}"`).join(' ');
        return;
      }
      if (mobile && tiles.length === 3) {
        grid.style.gridTemplateColumns = `${ratios[1]}fr ${ratios[2]}fr`;
        grid.style.gridTemplateAreas = '"media0 media0" "media1 media2"';
        return;
      }
      if (mobile && tiles.length === 4) {
        grid.style.gridTemplateColumns = `${ratios[0]}fr ${Math.max(.1, ratios[1] - ratios[0])}fr ${ratios[0]}fr`;
        grid.style.gridTemplateAreas = '"media0 media1 media1" "media2 media2 media3"';
        return;
      }
      const columns = id === 'solar' ? [[0],[1],[2]] : tiles.length === 4 ? [[0],[1,2],[3]] : [[0],[1,2]];
      const measures = columns.map(indices => ({
        scale: indices.reduce((sum, i) => sum + 1 / ratios[i], 0),
        labels: indices.reduce((sum, i) => sum + tiles[i].querySelector('.composition-label').getBoundingClientRect().height, 0) + gap * (indices.length - 1)
      }));
      const height = (width - gap * (columns.length - 1) + measures.reduce((sum, c) => sum + c.labels / c.scale, 0)) / measures.reduce((sum, c) => sum + 1 / c.scale, 0);
      grid.style.gridTemplateColumns = measures.map(c => `${Math.max(1, (height - c.labels) / c.scale).toFixed(2)}px`).join(' ');
      grid.style.gridTemplateAreas = id === 'solar' ? '"media0 media1 media2"' : tiles.length === 4 ? '"media0 media1 media3" "media0 media2 media3"' : '"media0 media1" "media0 media2"';
    };
    const schedule = () => {
      if (scheduled) return;
      scheduled = true; requestAnimationFrame(layout);
    };
    let lastWidth = 0;
    new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      if (Math.abs(width - lastWidth) > .5) { lastWidth = width; schedule(); }
    }).observe(grid);
    const captions = new ResizeObserver(schedule);
    tiles.forEach(tile => {
      captions.observe(tile.querySelector('.composition-label'));
      const media = tile.querySelector('img,video');
      if (!media) return;
      const updateRatio = () => {
        const width = media.naturalWidth || media.videoWidth;
        const height = media.naturalHeight || media.videoHeight;
        if (!width || !height) return;
        tile.dataset.ratio = width / height;
        tile.style.setProperty('--media-ratio', width / height);
        schedule();
      };
      media.addEventListener(media.tagName === 'VIDEO' ? 'loadedmetadata' : 'load', updateRatio);
      updateRatio();
    });
    schedule();
  }
  function compositionFor(id, indexShowcase = false) {
    const project = projects.find(p => p.id === id);
    if (!project || !compositions[id]) return null;
    const config = indexShowcase
      ? { ...compositions[id], ...indexCompositions[id], layout:'index-three', areas:['hero','detail','context'] }
      : compositions[id];
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
      const source = clip || project.media[photo.mediaIndex];
      const ratio = !clip && photo.crop ? photo.crop[2] / photo.crop[3] : (source?.width / source?.height || 1);
      link.dataset.ratio = ratio;
      link.style.setProperty('--media-ratio', ratio);
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
      label.textContent = config.labels[index] + (clip && !indexShowcase ? ' / Expand clip' : '');
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
    figure.append(grid,caption);
    if (!indexShowcase) { figure.dataset.naturalLayout = ''; fitComposition(grid, id); }
    return figure;
  }
  document.querySelectorAll('[data-showcase-project]').forEach(slot => {
    const composition = compositionFor(slot.dataset.showcaseProject);
    if (composition) slot.replaceWith(composition);
  });
  // Editorial projects can link straight to their stories and products while
  // sharing the same natural-size image layout as the media galleries.
  document.querySelectorAll('[data-static-composition]').forEach(figure => {
    fitComposition(figure.querySelector('.composition-grid'), figure.dataset.staticComposition);
  });
  document.querySelectorAll('.system-slide').forEach(slide => {
    const composition = compositionFor(slide.id.replace('system-', ''), true);
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
    link.href = `photos.html?project=${encodeURIComponent(currentProject.id)}`;
    link.textContent = 'All project photos & videos';collection.append(link);
    document.querySelector('main').append(collection);
  }
  if (document.querySelector('.motion-section')) {
    document.querySelectorAll('.scene-strip').forEach(strip => strip.remove());
  }
})();
