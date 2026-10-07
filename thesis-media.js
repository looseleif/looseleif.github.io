(() => {
  document.querySelectorAll('.step-visuals').forEach((group, groupIndex) => {
    const figures = [...group.children].filter(item => item.matches('.thesis-figure,.thesis-demo'));
    if (!figures.length) return;
    figures.forEach(figure => {
      const img = figure.querySelector('.thesis-image img');
      if (img) {
        const ratio = Number(img.getAttribute('width')) / Number(img.getAttribute('height'));
        figure.style.setProperty('--media-ratio', ratio);
        if (ratio < .8) figure.classList.add('portrait-figure');
      }
      const video = figure.querySelector('video');
      if (video) {
        // Reserve the original recording's proportions before lazy loading.
        if (!video.hasAttribute('width')) video.width = 720;
        if (!video.hasAttribute('height')) video.height = video.dataset.src?.endsWith('aggro1.mp4') ? 532 : 720;
      }
    });
    group.classList.add('media-browser');
    if (figures.length < 2) return;

    // Lead with motion when this step has a supporting demonstration.
    const items = [...figures.filter(item => item.matches('.thesis-demo')), ...figures.filter(item => !item.matches('.thesis-demo'))];
    const controls = document.createElement('div');controls.className = 'media-controls';
    const previous = document.createElement('button');previous.type = 'button';previous.textContent = '←';previous.setAttribute('aria-label','Previous figure or demonstration');
    const next = document.createElement('button');next.type = 'button';next.textContent = '→';next.setAttribute('aria-label','Next figure or demonstration');
    const status = document.createElement('p');status.className = 'media-position';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    controls.append(status,previous,next);
    const choices = document.createElement('div');choices.className = 'media-choices';choices.setAttribute('role','group');choices.setAttribute('aria-label','Figures and demonstrations in this step');
    const buttons = items.map((item,i) => {
      item.id ||= `thesis-media-${groupIndex}-${i}`;
      const button = document.createElement('button');button.type = 'button';
      button.textContent = item.dataset.mediaLabel || item.querySelector('.figure-number')?.textContent || 'Demonstration';
      button.setAttribute('aria-controls',item.id);
      button.title = item.querySelector('figcaption strong')?.textContent || 'Watch the prototype demonstration';
      choices.append(button);return button;
    });
    group.replaceChildren(controls,choices,...items);
    let current = 0;
    function show(index, announce = true) {
      current = (index + items.length) % items.length;
      items.forEach((item,i) => {
        item.hidden = i !== current;
        if (i !== current) item.querySelector('video')?.pause();
        buttons[i].setAttribute('aria-pressed',String(i === current));
      });
      status.textContent = `${current+1} / ${items.length} · ${items[current].dataset.mediaLabel || (items[current].matches('.thesis-demo') ? 'Demonstration' : 'Thesis figure')}`;
      if (announce) {
        items[current].querySelectorAll('figcaption [data-terminal-text]').forEach(element => window.typePortfolioText?.(element));
        // Shared playback observes only the newly visible video.
        document.dispatchEvent(new CustomEvent('portfolio:system'));
      }
    }
    previous.addEventListener('click',()=>show(current-1));
    next.addEventListener('click',()=>show(current+1));
    buttons.forEach((button,i)=>button.addEventListener('click',()=>show(i)));
    choices.addEventListener('keydown',event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      event.preventDefault();
      show(event.key==='Home' ? 0 : event.key==='End' ? items.length-1 : current+(event.key==='ArrowRight' ? 1 : -1));
      buttons[current].focus();
    });
    show(0,false);
  });
})();
