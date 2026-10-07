(() => {
  const active = new Map();
  const registered = new WeakSet();
  const waiting = new Set();
  const typingDuration = 1000;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const excluded = 'script,style,noscript,svg,textarea,select,option,.sr-only,.typed-accessible,.typed-run,form,.review-controls,.photo-file,[role=status]';
  const blocks = 'h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption,th,td,button,label,summary';
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
  const characters = text => segmenter ? [...segmenter.segment(text)].map(item => item.segment) : Array.from(text);
  function finish(element) {
    waiting.delete(element);
    observer.unobserve(element);
    element.querySelectorAll('.typed-caret').forEach(glyph => glyph.classList.remove('typed-caret'));
    element.querySelectorAll('.typed-pending').forEach(glyph => glyph.classList.remove('typed-pending'));
    const state = active.get(element);
    if (!state) return;
    cancelAnimationFrame(state.frame);
    state.glyphs.forEach(glyph => glyph.classList.remove('typed-pending'));
    element.classList.remove('is-text-typing');
    active.delete(element);
  }
  function typeText(element, replacement) {
    if (!element || element.closest(excluded)) return;
    finish(element);
    // Callers can replace a changing caption; ordinary page text keeps its links and markup.
    if (replacement !== undefined) element.textContent = replacement;
    const runs = [...element.querySelectorAll('.typed-run')];
    const glyphs = runs.flatMap(run => [...run.children]);
    const walker = document.createTreeWalker(element,NodeFilter.SHOW_TEXT,{
      acceptNode: node => node.textContent.trim() && !node.parentElement.closest(excluded) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const nodes = [];while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const visual = document.createElement('text-run');visual.className = 'typed-run';visual.setAttribute('aria-hidden','true');
      characters(node.textContent).forEach(char => {
        const glyph = document.createElement('text-glyph');glyph.className = 'typed-glyph';glyph.textContent = char;visual.append(glyph);
      });
      const accessible = document.createElement('span');accessible.className = 'typed-accessible sr-only';accessible.textContent = node.textContent;
      node.replaceWith(visual,accessible);
    });
    // Query in document order, including runs inside inline links and emphasis.
    glyphs.splice(0,glyphs.length,...element.querySelectorAll('.typed-glyph'));
    element.dataset.terminalText = [...element.querySelectorAll('.typed-accessible')].map(node => node.textContent).join('');
    if (!glyphs.length || reducedMotion.matches) return;
    glyphs.forEach(glyph => glyph.classList.add('typed-pending'));
    waiting.add(element);
    observer.observe(element);
  }
  function startTyping(element) {
    if (!waiting.has(element) || document.hidden || element.closest('[hidden]')) return;
    waiting.delete(element);observer.unobserve(element);
    const glyphs = [...element.querySelectorAll('.typed-glyph')];
    element.classList.add('is-text-typing');
    const state = { glyphs, frame:0, shown:0, start:performance.now() };active.set(element,state);
    const tick = now => {
      if (!element.isConnected || element.closest('[hidden]')) { finish(element);return; }
      const count = Math.min(glyphs.length,Math.max(0,Math.ceil((now-state.start)/typingDuration*glyphs.length)));
      if (state.shown) glyphs[state.shown-1].classList.remove('typed-caret');
      while (state.shown<count) glyphs[state.shown++].classList.remove('typed-pending');
      if (count===glyphs.length) finish(element);
      else {
        if (count) glyphs[count-1].classList.add('typed-caret');
        state.frame=requestAnimationFrame(tick);
      }
    };
    state.frame=requestAnimationFrame(tick);
  }
  window.typePortfolioText = typeText;
  window.updatePortfolioText = (element,text) => {
    if (!element) return;
    const accessible = [...element.querySelectorAll('.typed-accessible')];
    const current = accessible.length ? accessible.map(node => node.textContent).join('') : element.textContent;
    if (current !== text) typeText(element,text);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      startTyping(entry.target);
    });
  },{threshold:0});
  function collect(root) {
    const walker = document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode: node => node.textContent.trim() && !node.parentElement.closest(excluded) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    });
    const candidates = new Set();
    while (walker.nextNode()) {
      const parent = walker.currentNode.parentElement;
      const element = parent.closest(blocks) || parent.closest('a') || parent;
      if (!['BODY','MAIN','SECTION','ARTICLE'].includes(element.tagName)) candidates.add(element);
    }
    return [...candidates].filter(element => ![...candidates].some(other => other!==element && other.contains(element)));
  }
  function register(root) {
    collect(root).forEach(element => {
      if (registered.has(element)) return;
      registered.add(element);typeText(element);
    });
  }
  function retypeWithin(root) {
    if (!root) return;
    // Previously wrapped text no longer appears in collect(), so include its containing blocks.
    const elements = new Set(collect(root));
    if (root.hasAttribute('data-terminal-text')) elements.add(root);
    root.querySelectorAll('[data-terminal-text]').forEach(element => elements.add(element));
    [...elements].filter(element => ![...elements].some(other => other!==element && other.contains(element))).forEach(element => {
      observer.unobserve(element);registered.add(element);typeText(element);
    });
  }
  window.retypeProjectPanel = slide => retypeWithin(slide?.querySelector('.terminal-panel'));
  document.addEventListener('portfolio:system',() => retypeWithin(document.querySelector('.system-slide:not([hidden])')));
  document.querySelectorAll('.project-reel').forEach(reel => {
    reel.addEventListener('portfolio:frame',() => retypeWithin(reel.querySelector('.reel-slide:not([hidden]) figcaption')));
  });
  register(document.body);
  // Captions and expanded galleries can be inserted or updated after the page loads.
  new MutationObserver(records => {
    const changed = new Set();
    records.forEach(record => {
      const element = record.target.nodeType===Node.TEXT_NODE ? record.target.parentElement : record.target;
      if (!element || element.closest(excluded)) return;
      if (record.type==='childList' && record.addedNodes.length && [...record.addedNodes].every(node => node.nodeType===1 && node.matches('.typed-run,.typed-accessible'))) return;
      changed.add(element);
    });
    waiting.forEach(element => { if (!element.isConnected) finish(element); });
    changed.forEach(element => {
      register(element);
      if (registered.has(element) && element.getClientRects().length) typeText(element);
    });
  }).observe(document.body,{childList:true,subtree:true,characterData:true});
  const finishAll = () => new Set([...active.keys(),...waiting]).forEach(finish);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) [...active.keys()].forEach(finish);
    else waiting.forEach(element => { observer.unobserve(element);observer.observe(element); });
  });
  window.addEventListener('pageshow',event => { if (event.persisted) retypeWithin(document.querySelector('main')); });
  reducedMotion.addEventListener('change',() => { if (reducedMotion.matches) finishAll(); });
  window.addEventListener('beforeprint',finishAll);
})();
