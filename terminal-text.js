(() => {
  const active = new Map();
  const targets = new Set();
  function typeText(element, text) {
    if (!element) return;
    cancelAnimationFrame(active.get(element)); active.delete(element);
    element.dataset.terminalText = text;
    targets.add(element);
    element.classList.add('terminal-reveal');
    const measure = document.createElement('span');
    measure.className = 'terminal-measure'; measure.textContent = text;
    measure.setAttribute('aria-hidden', 'true');
    const visual = document.createElement('span');
    visual.className = 'terminal-visual';visual.setAttribute('aria-hidden', 'true');
    const accessible = document.createElement('span');
    accessible.className = 'sr-only';accessible.textContent = text;
    element.replaceChildren(measure, visual, accessible);
    const finish = () => { visual.textContent = text;element.classList.remove('is-typing');active.delete(element); };
    if (document.hidden) { finish();return; }
    const start = performance.now();
    const duration = 1000;
    element.classList.add('is-typing');
    function tick(now) {
      const length = Math.min(text.length, Math.ceil((now - start) / duration * text.length));
      visual.textContent = text.slice(0, length);
      if (length === text.length) finish();
      else active.set(element, requestAnimationFrame(tick));
    }
    active.set(element, requestAnimationFrame(tick));
  }
  window.typePortfolioText = typeText;
  const captionText = el => el.dataset.terminalText || el.textContent;
  const revealReel = reel => {
    const caption = reel.querySelector('.reel-slide:not([hidden]) figcaption');
    if (caption && !reel.closest('.cinematic-showcase')) typeText(caption, captionText(caption));
  };
  document.querySelectorAll('.project-reel').forEach(reel => {
    reel.addEventListener('portfolio:frame', () => revealReel(reel));
    let shown = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !shown) { shown = true;revealReel(reel); }
    }, { threshold:.05 }).observe(reel);
  });
  document.querySelectorAll('.work-showcase .project-composition figcaption').forEach(caption => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) { typeText(caption, captionText(caption));observer.disconnect(); }
    }, { threshold:.1 });
    observer.observe(caption);
  });
  function retypeProjectPanel(slide, text) {
    const panel = slide?.querySelector('.terminal-panel');
    const description = panel?.querySelector('dd:last-of-type');
    if (description) typeText(description, text || captionText(description));
    const title = panel?.querySelector('h2');
    if (title) typeText(title, captionText(title));
    const command = panel?.querySelector('[data-type-command]');
    if (command) typeText(command, '> ' + command.dataset.typeCommand);
  }
  window.retypeProjectPanel = retypeProjectPanel;
  function revealProject() {
    retypeProjectPanel(document.querySelector('.system-slide:not([hidden])'));
  }
  document.addEventListener('portfolio:system', revealProject);
  revealProject();
  document.querySelectorAll('.heading-note>p,.case-deck,.about-deck,.studio-hero>div>p:not(.eyebrow),.socio-hero .lead').forEach(el => typeText(el,el.textContent));
  document.querySelectorAll('.social-handle').forEach(el => typeText(el, el.textContent));
  const finishAll = () => targets.forEach(el => {
    if (!active.has(el)) return;
    cancelAnimationFrame(active.get(el));active.delete(el);
    el.querySelector('.terminal-visual').textContent = el.dataset.terminalText;
    el.classList.remove('is-typing');
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishAll(); });
})();
