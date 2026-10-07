(() => {
  'use strict';
  const projects = window.portfolioProjects || [];
  const library = new Map();
  projects.forEach(project => project.media.forEach((media, index) => {
    if (!library.has(media.src)) library.set(media.src, {
      id:media.src, ...media, uses:[], archived:true,
      kind:media.kind === 'video' || /\.gif$/i.test(media.src) ? 'video' : 'image'
    });
    const item = library.get(media.src);
    item.uses.push({project:project.id, title:project.title, index, caption:media.caption, year:media.year, archived:!!media.archived});
    item.archived = item.archived && !!media.archived;
  }));
  const items = [...library.values()].filter(item => !item.duplicateOf).sort((a,b) => Number(a.archived) - Number(b.archived));
  const key = 'chase-portfolio-media-review-v1';
  const actions = {remove:'Remove', improve:'Improve', replace:'Replace'};
  const grid = document.querySelector('#photo-grid');
  const dialog = document.querySelector('#photo-dialog');
  const status = document.querySelector('#save-status');
  const count = document.querySelector('#photo-count');
  const filters = ['search','project','kind','review'].map(name => document.querySelector('#photo-'+name));
  const [search, projectFilter, kindFilter, reviewFilter] = filters;
  let records = {}, storageWorks = true, opener = null;
  const visibleVideos = new Set();
  function validRecords(value) {
    const clean = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid review entries.');
    for (const [id, record] of Object.entries(value)) {
      if (!library.has(id)) continue;
      if (!record || !Object.hasOwn(actions, record.action) || typeof record.note !== 'string' || record.note.length > 4000) throw new Error('Invalid review entry.');
      const canonicalId = library.get(id).duplicateOf || id;
      if (clean[canonicalId]?.updatedAt > (record.updatedAt || '')) continue;
      clean[canonicalId] = {action:record.action, note:record.note, updatedAt:typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString()};
    }
    return clean;
  }
  try {
    const saved = localStorage.getItem(key);
    if (saved) records = validRecords(JSON.parse(saved));
  } catch {
    storageWorks = false;
    status.textContent = 'Browser storage is unavailable or unreadable. Export your review before leaving this page.';
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(records)); storageWorks = true;
      status.textContent = 'Review saved in this browser. Export it to share your changes.';
    } catch {
      storageWorks = false;
      status.textContent = 'Review is only saved for this visit. Export it before leaving this page.';
    }
    updateCount();
  }
  function updateCount() { document.querySelector('#review-count').textContent = `(${Object.keys(records).length})`; }
  function syncMotion() {
    document.querySelectorAll('.photo-open video, #photo-dialog-media video').forEach(video => {
      const inDialog = !!video.closest('#photo-dialog');
      if (!document.hidden && (inDialog ? dialog.open : !dialog.open && visibleVideos.has(video))) {
        if (!video.getAttribute('src')) video.src = video.dataset.src;
        video.autoplay = true;
        window.portfolioMotion.play(video);
      } else video.pause();
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visibleVideos.add(entry.target) : visibleVideos.delete(entry.target));
    syncMotion();
  }, {threshold:.1});
  function mediaFor(item) {
    const video = /\.(mp4|webm)$/i.test(item.src);
    const element = document.createElement(video ? 'video' : 'img');
    if (video) {
      element.dataset.src = item.src; element.poster = item.poster || '';
      element.loop = true; element.preload = 'none';
      element.setAttribute('aria-label',item.caption);
      window.portfolioMotion.configure(element,item.src);
      element.addEventListener('canplay',syncMotion);
    } else {
      element.src = item.src; element.alt = item.caption; element.loading = 'lazy'; element.decoding = 'async';
    }
    return element;
  }
  function refreshControls(id) {
    const record = records[id];
    document.querySelectorAll('[data-review-id]').forEach(control => {
      if (control.dataset.reviewId !== id) return;
      control.querySelectorAll('[data-action]').forEach(button => button.setAttribute('aria-pressed',String(record?.action === button.dataset.action)));
      control.querySelector('.review-clear').hidden = !record;
      control.querySelector('.review-notes').hidden = !record;
      const input = control.querySelector('textarea');
      if (input !== document.activeElement) input.value = record?.note || '';
    });
    const card = [...grid.children].find(card => card.dataset.mediaId === id);
    if (card) { if (record) card.dataset.action = record.action; else delete card.dataset.action; }
  }
  function controlsFor(item) {
    const control = document.createElement('div'); control.className = 'review-controls'; control.dataset.reviewId = item.id;
    const buttons = document.createElement('div');buttons.className = 'review-actions';buttons.setAttribute('role','group');buttons.setAttribute('aria-label','Review this media');
    for (const [action,label] of Object.entries(actions)) {
      const button = document.createElement('button');button.type = 'button';button.dataset.action = action;button.textContent = label;
      button.setAttribute('aria-pressed',String(records[item.id]?.action === action));
      button.setAttribute('aria-label',`Mark for ${action}: ${item.src.split('/').pop()}`);
      button.addEventListener('click',() => {
        records[item.id] = {action, note:records[item.id]?.note || '', updatedAt:new Date().toISOString()};
        save(); refreshControls(item.id);
        if (reviewFilter.value !== 'all') render();
      });
      buttons.append(button);
    }
    const clear = document.createElement('button');clear.type = 'button';clear.className = 'review-clear';clear.textContent = 'Clear';clear.hidden = !records[item.id];
    clear.setAttribute('aria-label','Clear mark and note');
    clear.addEventListener('click',() => {delete records[item.id];save();refreshControls(item.id);if (reviewFilter.value !== 'all') render();});
    buttons.append(clear);
    const label = document.createElement('label');label.className = 'review-notes';label.hidden = !records[item.id];label.append('What should change?');
    const notes = document.createElement('textarea');notes.maxLength = 4000;notes.placeholder = 'A better crop, a replacement photo, a caption correction...';notes.value = records[item.id]?.note || '';
    notes.addEventListener('input',() => {
      records[item.id] = {action:records[item.id]?.action || 'improve',note:notes.value,updatedAt:new Date().toISOString()};
      save();refreshControls(item.id);
    });
    label.append(notes);control.append(buttons,label);return control;
  }
  function originalLink(item) {
    const link = document.createElement('a');link.className = 'photo-file';link.href = item.src;link.target = '_blank';link.rel = 'noopener';link.textContent = item.sourceFilename || item.src;
    link.title = item.src;
    return link;
  }
  function openPhoto(item,button) {
    opener = button;
    document.querySelector('#photo-dialog-title').textContent = item.uses.map(use => use.title).filter((title,i,all) => all.indexOf(title) === i).join(' / ');
    document.querySelector('#photo-dialog-media').replaceChildren(mediaFor(item));
    const caption = document.createElement('p');caption.textContent = item.caption;
    document.querySelector('#photo-dialog-info').replaceChildren(caption,originalLink(item),controlsFor(item));
    dialog.showModal();syncMotion();
  }
  function matches(item) {
    const record = records[item.id];
    const needle = search.value.trim().toLocaleLowerCase();
    return (projectFilter.value === 'all' || item.uses.some(use => use.project === projectFilter.value))
      && (kindFilter.value === 'all' || item.kind === kindFilter.value)
      && (reviewFilter.value === 'all' || (reviewFilter.value === 'marked' ? !!record : reviewFilter.value === 'unmarked' ? !record : record?.action === reviewFilter.value))
      && (!needle || [item.src,item.sourceFilename,item.year,item.context,item.caption,...item.uses.map(use => use.title)].join(' ').toLocaleLowerCase().includes(needle));
  }
  function render() {
    const moveFocus = grid.contains(document.activeElement);
    observer.disconnect();visibleVideos.clear();grid.querySelectorAll('video').forEach(video => video.pause());
    const matched = items.filter(matches);
    const fragment = document.createDocumentFragment();
    matched.forEach(item => {
      const card = document.createElement('article');card.className = 'photo-card';card.dataset.mediaId = item.id;
      if (records[item.id]) card.dataset.action = records[item.id].action;
      const open = document.createElement('button');open.type = 'button';open.className = 'photo-open';open.setAttribute('aria-label','Open: '+item.caption);open.append(mediaFor(item));
      const badge = document.createElement('span');badge.className = 'photo-badge';badge.textContent = (item.kind === 'video' ? 'Motion' : item.source ? 'Extracted frame' : 'Image') + (item.archived ? ' / Archived' : '');open.append(badge);
      open.addEventListener('click',() => openPhoto(item,open));
      const copy = document.createElement('div');copy.className = 'photo-copy';
      const projectNames = document.createElement('p');projectNames.className = 'photo-projects';projectNames.textContent = [...new Set(item.uses.map(use => use.title))].join(' / ');
      const caption = document.createElement('h2');caption.textContent = item.caption;
      copy.append(projectNames,caption,originalLink(item),controlsFor(item));card.append(open,copy);fragment.append(card);
    });
    grid.replaceChildren(fragment);
    grid.querySelectorAll('video').forEach(video => observer.observe(video));
    count.textContent = `${matched.length} of ${items.length} entries`;
    document.querySelector('#photo-empty').hidden = matched.length !== 0;
    if (moveFocus) count.focus({preventScroll:true});
  }
  projects.forEach(project => {const option = document.createElement('option');option.value = project.id;option.textContent = project.title;projectFilter.append(option);});
  const requestedProject = new URLSearchParams(location.search).get('project');
  if (projects.some(project => project.id === requestedProject)) projectFilter.value = requestedProject;
  filters.forEach(filter => filter.addEventListener(filter === search ? 'input' : 'change',render));
  document.querySelector('#close-photo').addEventListener('click',() => dialog.close());
  dialog.addEventListener('close',() => {
    document.querySelector('#photo-dialog-media video')?.pause();
    document.querySelector('#photo-dialog-media').replaceChildren();syncMotion();
    if (opener?.isConnected) opener.focus();else count.focus({preventScroll:true});
  });
  document.addEventListener('visibilitychange',syncMotion);
  document.querySelector('#export-review').addEventListener('click',() => {
    const entries = Object.entries(records).map(([id,record]) => ({id,...record,caption:library.get(id).caption,sourceFilename:library.get(id).sourceFilename,year:library.get(id).year,uses:library.get(id).uses}));
    const payload = {schema:'chase-portfolio-media-review',version:1,exportedAt:new Date().toISOString(),entries};
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'}));
    const link = document.createElement('a');link.href = url;link.download = 'portfolio-photo-review.json';document.body.append(link);link.click();link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
    status.textContent = `Exported ${entries.length} marked entries. Send portfolio-photo-review.json in chat.`;
  });
  document.querySelector('#import-review').addEventListener('change',async event => {
    const file = event.target.files[0];if (!file) return;
    try {
      if (file.size > 1000000) throw new Error('This file is too large. Choose an exported photo review.');
      const payload = JSON.parse(await file.text());
      if (payload.schema !== 'chase-portfolio-media-review' || payload.version !== 1 || !Array.isArray(payload.entries)) throw new Error('Choose a portfolio photo review JSON file.');
      const incoming = validRecords(Object.fromEntries(payload.entries.map(entry => [entry.id,entry])));
      records = {...records,...incoming};save();render();
      status.textContent = `Imported ${Object.keys(incoming).length} matching entries.${storageWorks ? ' Saved in this browser.' : ' Export before leaving.'}`;
    } catch(error) {status.textContent = 'Could not import: '+error.message;}
    event.target.value = '';
  });
  window.addEventListener('storage',event => {
    if (event.key !== key) return;
    try {records = event.newValue ? validRecords(JSON.parse(event.newValue)) : {};render();updateCount();} catch { /* Keep the current valid review. */ }
  });
  updateCount();render();
})();
