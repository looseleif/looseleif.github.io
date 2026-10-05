(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = [...document.querySelectorAll('.exhibit-stage')];
  let scheduled = false;
  const update = () => {
    scheduled = false;
    stages.forEach(stage => {
      const box = stage.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const distance = reduced.matches ? 0 : Math.max(-16, Math.min(16, (innerHeight / 2 - box.top - box.height / 2) * .045));
      stage.style.setProperty('--scene-offset', `${distance}px`);
    });
  };
  const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  reduced.addEventListener('change', () => { stages.forEach(s => s.style.setProperty('--scene-offset','0px')); schedule(); });
  update();
})();
