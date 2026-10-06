(() => {
  if (!document.querySelector('.case-intro')) return;
  const page = location.pathname.split('/').pop();
  const project = (window.portfolioProjects || []).find(p => p.page === page);
  if (!project) return;
  const mainClips = {
    aggro:'videos/loops/aggro1.mp4',
    solar:'videos/loops/solar.mp4',
    awear:'videos/loops/awear.mp4',
    'feedback-loop':'videos/loops/homeo1.mp4',
    'electric-drives':'videos/loops/board.mp4'
  };
  const source = mainClips[project.id];
  const clip = project.media.find(m => m.src === source);
  const photo = (window.focusedProjectPhotos || {})[project.id]?.[0];
  if (!clip && !photo) return;
  const background = document.createElement('div');
  background.className = 'project-background';
  background.setAttribute('aria-hidden','true');
  document.body.classList.add('has-project-background');
  document.body.prepend(background);
  if (clip) {
    const video = document.createElement('video');
    video.src = source;video.poster = clip.poster;video.loop = true;
    video.preload = 'auto';video.tabIndex = -1;
    background.append(video);
    window.portfolioMotion.configure(video, source);
    let galleryOpen = false;
    const sync = () => {
      if (document.hidden || galleryOpen) video.pause();
      else window.portfolioMotion.play(video);
    };
    video.addEventListener('canplay', sync);
    document.addEventListener('visibilitychange', sync);
    document.addEventListener('portfolio:gallery', event => { galleryOpen = event.detail.open;sync(); });
    window.addEventListener('pageshow', sync);
    sync();
  } else {
    // Projects without footage keep their own photography as the backdrop.
    const image = document.createElement('img');
    image.src = photo.displaySource;image.alt = '';background.append(image);
  }
})();
