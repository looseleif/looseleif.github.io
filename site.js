document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

document.querySelectorAll('[data-animation]').forEach(button => {
  button.hidden = false;
  const image = button.parentElement.querySelector('img');
  const poster = image.src;
  const stop = () => {
    image.src = poster;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = 'Play animation';
  };
  button.addEventListener('click', () => {
    if (button.getAttribute('aria-pressed') === 'true') { stop(); return; }
    image.src = button.dataset.animation;
    button.setAttribute('aria-pressed', 'true');
    button.textContent = 'Stop animation';
  });
  image.addEventListener('error', stop);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
});
