(() => {
  document.querySelectorAll('.clip-grid,.inline-clips').forEach(group => {
    const clips = [...group.querySelectorAll('.clip-player')];
    if (clips.length < 2) return;
    group.classList.add('clip-playlist');
    let index = 0;
    const footer = document.createElement('div');footer.className = 'recording-navigation';
    const label = document.createElement('p');
    footer.append(label);group.after(footer);
    function show(nextIndex) {
      index = (nextIndex + clips.length) % clips.length;
      clips.forEach((clip,i) => {
        const video = clip.querySelector('video');
        clip.hidden = i !== index;
        if (i !== index) video.pause();
        else if (video.ended) video.currentTime = 0;
      });
      label.textContent = clips[index].querySelector('video').getAttribute('aria-label') || 'Project recording';
      document.dispatchEvent(new CustomEvent('portfolio:recording'));
    }
    clips.forEach((clip,i) => {
      const video = clip.querySelector('video');
      video.loop = false;
      if (i) video.preload = 'none';
      video.addEventListener('ended', () => show(index + 1));
    });
    show(0);
  });
})();
