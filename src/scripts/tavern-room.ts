const room = document.querySelector<HTMLElement>('.tavern-room');
if (room) {
  const canvas = room.querySelector<HTMLElement>('.room-canvas')!;
  const image = room.querySelector<HTMLImageElement>('.room-art')!;
  const toggle = room.querySelector<HTMLButtonElement>('#motion-toggle')!;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const pointer = matchMedia('(hover:hover) and (pointer:fine)');
  let paused = false;
  try { paused = localStorage.getItem('bit-tavern-room-motion') === 'paused'; } catch {}

  function fitScene() {
    if (!image.naturalWidth) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    // Limit side cropping so the study and storyteller remain reachable.
    const width = Math.min(Math.max(room!.clientWidth, room!.clientHeight * ratio), room!.clientWidth * 1.2);
    canvas.style.width = width + 'px';
    canvas.style.height = width / ratio + 'px';
    canvas.style.marginTop = width / ratio > room!.clientHeight * 1.5 ? width / ratio * 0.02 + 'px' : '0px';
    const bottom = room!.getBoundingClientRect().bottom - 72;
    room!.querySelectorAll<HTMLElement>('.destination-label').forEach(label => {
      label.style.bottom = '0px';
      label.style.bottom = Math.max(0, label.getBoundingClientRect().bottom - bottom) + 'px';
    });
  }
  image.addEventListener('load', fitScene);
  new ResizeObserver(fitScene).observe(room);
  addEventListener('pageshow', fitScene);
  fitScene();

  function updateMotion() {
    const stopped = paused || reduce.matches;
    room!.classList.toggle('room-paused', stopped || document.hidden);
    toggle.disabled = reduce.matches;
    toggle.setAttribute('aria-pressed', String(stopped));
    const label = reduce.matches ? '已按系统设置减少动态效果' : stopped ? '播放环境动画' : '暂停环境动画';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.querySelector('span')!.textContent = stopped ? '▷' : 'Ⅱ';
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('bit-tavern-room-motion', paused ? 'paused' : 'playing'); } catch {}
    updateMotion();
  });
  reduce.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  addEventListener('pageshow', updateMotion);
  updateMotion();

  function updateHint() {
    room!.querySelector('.room-hint')!.textContent = pointer.matches
      ? '移近书房或酒保，开始探索'
      : '轻触书房或酒保，开始探索';
  }
  pointer.addEventListener('change', updateHint);
  updateHint();
}

export {};
