(() => {
  'use strict';
  const video = document.querySelector('#episode-video');
  if (!video) return;
  const players = [...document.querySelectorAll('video')];
  players.forEach(player => player.addEventListener('play', () => {
    players.forEach(other => { if (other !== player) other.pause(); });
  }));
  const cards = [...document.querySelectorAll('.episode-card')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const eras = [...document.querySelectorAll('[data-era-select]')];
  const viewer = document.querySelector('#watch');
  const error = document.querySelector('#player-error');
  let episodes = [], current = 0, filter = 'awareness';
  const clock = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (window.updatePortfolioText) window.updatePortfolioText(node, value);
    else node.textContent = value;
  };
  function setFilter(value) {
    filter = value;
    cards.forEach(card => { card.hidden = value !== 'all' && card.dataset.era !== value; });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === value)));
    eras.forEach(link => {
      if (link.dataset.eraSelect === value) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    text('#catalog-title', value === 'all' ? 'Every episode, in order' : `The ${value === 'agency' ? 'Agency' : 'Awareness'} era`);
    text('#catalog-kicker', value === 'all' ? 'THE COMPLETE SERIES / 22 EPISODES' : value === 'agency' ? 'THE CURRENT ERA / CONVERSATIONS & PROTOTYPES' : 'FIGURING IT OUT');
  }
  function show(index, scroll = false) {
    const next = episodes[index];
    if (!next) return;
    current = index;
    players.forEach(player => player.pause());
    error.hidden = true;
    video.poster = next.poster;
    if (next.media) video.style.aspectRatio = `${next.media.width} / ${next.media.height}`;
    video.setAttribute('aria-label', `Selected passage from ${next.title}`);
    video.querySelector('source').src = next.video;
    video.querySelector('track')?.remove();
    const track = document.createElement('track');
    Object.assign(track, {kind:'captions', src:next.captions, srclang:'en', label:'English (automatic)'});
    video.append(track);
    const fallback = video.querySelector('a');
    if (fallback) fallback.href = next.source;
    video.load();
    text('#selected-meta', `${next.era.toUpperCase()} / EPISODE ${String(next.number).padStart(2, '0')} / ${next.dateLabel}`);
    text('#selected-focus', next.focus);
    text('#selected-title', next.title);
    text('#selected-summary', next.summary);
    text('#clip-label', next.clipLabel);
    text('#clip-range', `${clock(next.clipStart)}–${clock(next.clipEnd)} in the episode`);
    const moments = document.querySelector('#selected-moments');
    moments.replaceChildren(...next.moments.map(moment => {
      const li = document.createElement('li'), link = document.createElement('a'), time = document.createElement('span');
      link.href = `${next.source}&t=${moment.start}s`;
      time.textContent = clock(moment.start);
      link.append(time, ` ${moment.label} ↗`); li.append(link); return li;
    }));
    document.querySelector('#selected-source').href = next.source;
    text('#selected-source', `Watch the full episode / ${clock(next.duration)} ↗`);
    document.querySelector('#episode-position').textContent = `${String(next.number).padStart(2,'0')} / ${episodes.length}`;
    document.querySelector('#previous-episode').disabled = index === 0;
    document.querySelector('#next-episode').disabled = index === episodes.length - 1;
    document.querySelectorAll('[data-episode]').forEach(link => {
      if (Number(link.dataset.episode) === next.number) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (filter !== 'all' && filter !== next.era) setFilter(next.era);
    if (scroll) {
      viewer.scrollIntoView({behavior:'instant', block:'start'});
      viewer.focus({preventScroll:true});
    }
  }
  function route(scroll = true) {
    const hash = location.hash.slice(1);
    if (hash === 'awareness' || hash === 'agency') {
      setFilter(hash);
      show(hash === 'awareness' ? 0 : 12, false);
      if (scroll) document.querySelector('#episodes').scrollIntoView({behavior:'instant'});
    } else if (/^episode-\d{2}$/.test(hash)) {
      const i = episodes.findIndex(e => e.slug === hash);
      if (i >= 0) show(i, scroll);
    } else if (hash === 'action') {
      video.pause();
      eras.forEach(a => a.dataset.eraSelect === 'action' ? a.setAttribute('aria-current','true') : a.removeAttribute('aria-current'));
      if (scroll) document.querySelector('#action').scrollIntoView({behavior:'instant'});
    }
  }
  function navigate(hash) {
    if (location.hash !== `#${hash}`) history.pushState(null, '', `#${hash}`);
    route();
  }
  setFilter('awareness');
  video.addEventListener('error', () => { error.hidden = false; });
  video.querySelector('source').addEventListener('error', () => { error.hidden = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) players.forEach(player => player.pause()); });
  fetch('iykyd-episodes.json?v=79').then(response => {
    if (!response.ok) throw new Error('Episode guide unavailable');
    return response.json();
  }).then(data => {
    episodes = data.episodes;
    document.querySelectorAll('[data-episode]').forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); navigate(`episode-${String(link.dataset.episode).padStart(2,'0')}`);
    }));
    eras.forEach(link => link.addEventListener('click', event => {
      event.preventDefault(); navigate(link.dataset.eraSelect);
    }));
    filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
    document.querySelector('#previous-episode').addEventListener('click', () => navigate(episodes[current - 1].slug));
    document.querySelector('#next-episode').addEventListener('click', () => navigate(episodes[current + 1].slug));
    window.addEventListener('hashchange', () => route());
    if (location.hash) route();
  }).catch(() => {
    setFilter('all');
    document.querySelector('.era-filters').hidden = true;
    document.querySelector('.episode-traversal').hidden = true;
    cards.forEach(card => { const link = card.querySelector('[data-episode]'); link.href = card.querySelector('.episode-source').href; });
    text('#catalog-title', 'Explore the original episodes');
  });
})();
