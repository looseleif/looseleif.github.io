(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 16;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;
  const visible = new Set();
  const sampled = new WeakMap();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) visible.add(target);
      else visible.delete(target);
    });
    paint();
  });
  const hosts = document.querySelectorAll('.work-card,.clip-player,.portrait-crop,.stream-window,.exhibit-story,.media-entry,.gallery-stage,.intro-board,.visual-directory,.project-exhibit');
  function color(media) {
    if (media.tagName === 'VIDEO' ? media.readyState < 2 : !media.naturalWidth) return null;
    try {
      context.clearRect(0, 0, 16, 16);
      context.drawImage(media, 0, 0, 16, 16);
      const pixels = context.getImageData(0, 0, 16, 16).data;
      const bins = Array.from({ length: 12 }, () => [0, 0, 0, 0]);
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
        if (max < 45 || delta < 20) continue;
        let hue = max === r ? (g - b) / delta : max === g ? 2 + (b - r) / delta : 4 + (r - g) / delta;
        hue = (hue + 6) % 6;
        const bin = bins[Math.floor(hue * 2)];
        const weight = delta / 255;
        bin[0] += r * weight; bin[1] += g * weight; bin[2] += b * weight; bin[3] += weight;
      }
      const best = bins.reduce((a, b) => a[3] > b[3] ? a : b);
      return best[3] ? `rgb(${best.slice(0, 3).map(v => Math.round(v / best[3])).join(' ')})` : 'rgb(150 150 150)';
    } catch { return null; } // Cross-origin media keeps the neutral surface.
  }
  function paint() {
    if (document.hidden) return;
    visible.forEach(host => {
      const media = [...host.querySelectorAll('video,img')].filter(el => {
        if (el.closest('[hidden]')) return false;
        const box = el.getBoundingClientRect();
        return box.width && box.bottom > 0 && box.top < innerHeight;
      }).sort((a, b) => {
        const center = el => { const r = el.getBoundingClientRect(); return Math.abs(r.top + r.height / 2 - innerHeight / 2); };
        return center(a) - center(b);
      })[0];
      if (!media || (reduced.matches && sampled.get(host) === media)) return;
      const tint = color(media);
      if (tint) { host.style.setProperty('--scene-color', tint); sampled.set(host, media); }
    });
  }
  hosts.forEach(host => {
    host.classList.add('scene-lit');
    observer.observe(host);
    host.addEventListener('pointermove', event => {
      if (reduced.matches || event.pointerType === 'touch') return;
      const r = host.getBoundingClientRect();
      host.style.setProperty('--light-x', `${Math.round((event.clientX - r.left) / r.width * 100)}%`);
      host.style.setProperty('--light-y', `${Math.round((event.clientY - r.top) / r.height * 100)}%`);
    });
    host.addEventListener('pointerleave', () => {
      host.style.removeProperty('--light-x'); host.style.removeProperty('--light-y');
    });
  });
  setInterval(paint, 1000);
  document.addEventListener('visibilitychange', paint);
})();
