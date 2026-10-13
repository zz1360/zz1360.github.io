const roomElement = document.querySelector<HTMLElement>('.tavern-room');
if (roomElement) {
  const room = roomElement;
  const canvas = room.querySelector<HTMLElement>('.room-canvas')!;
  const image = room.querySelector<HTMLImageElement>('.room-art')!;
  const toggle = room.querySelector<HTMLButtonElement>('#motion-toggle')!;
  const hint = room.querySelector<HTMLElement>('.room-hint')!;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  const pointer = matchMedia('(hover:hover) and (pointer:fine)');
  const guidanceKey = 'bit-tavern-room-guidance-v1';
  type DestinationName = 'study' | 'storyteller';
  type Destination = {
    name: DestinationName;
    element: HTMLAnchorElement;
    glow: HTMLElement;
    response: HTMLElement;
    bounds: DOMRect | null;
    proximity: number;
    guiding: boolean;
    pressed: boolean;
  };
  const destinations: Destination[] = Array.from(room.querySelectorAll<HTMLAnchorElement>('.room-destination')).map(element => {
    const name = element.dataset.destination as DestinationName;
    return {
      name, element,
      glow: element.querySelector<HTMLElement>('.destination-glow')!,
      response: room.querySelector<HTMLElement>(`[data-response="${name}"]`)!,
      bounds: null, proximity: 0, guiding: false, pressed: false,
    };
  });
  let paused = false;
  let guidanceSeen = false;
  try { paused = localStorage.getItem('bit-tavern-room-motion') === 'paused'; } catch {}
  try { guidanceSeen = localStorage.getItem(guidanceKey) === 'seen'; } catch {}
  if (!guidanceSeen) {
    try { guidanceSeen = sessionStorage.getItem(guidanceKey) === 'seen'; } catch {}
  }
  let focused: Destination | null = null;
  let pointerPosition: { x: number; y: number } | null = null;
  let pointerFrame = 0;
  let guidanceQueued = false;
  let guidanceTimers: number[] = [];
  let navigation: { timer: number } | null = null;

  function motionAvailable() {
    return !paused && !reduce.matches && !document.hidden;
  }

  function rememberGuidance() {
    guidanceSeen = true;
    try { localStorage.setItem(guidanceKey, 'seen'); }
    catch { try { sessionStorage.setItem(guidanceKey, 'seen'); } catch {} }
  }

  function renderSignals() {
    let active = focused;
    let strongest = active ? 1 : 0;
    for (const destination of destinations) {
      const strength = Math.max(destination.proximity, destination.guiding ? .6 : 0, focused === destination ? 1 : 0, destination.pressed ? 1 : 0);
      const sceneStrength = motionAvailable() ? strength : 0;
      destination.response.style.opacity = sceneStrength.toFixed(2);
      if (strength > 0) destination.glow.style.opacity = strength.toFixed(2);
      else destination.glow.style.removeProperty('opacity');
      destination.element.dataset.proximity = destination.proximity.toFixed(2);
      destination.element.dataset.near = String(destination.proximity >= .08);
      destination.element.dataset.guiding = String(destination.guiding);
      destination.element.dataset.pressed = String(destination.pressed);
      if (destination.pressed || strength > strongest) {
        active = destination;
        strongest = strength;
      }
    }
    room.dataset.activeDestination = active && strongest >= .08 ? active.name : 'none';
  }

  function updateHint() {
    room.dataset.pointer = pointer.matches ? 'fine' : 'coarse';
    hint.textContent = pointer.matches
      ? '移近书房或酒保，开始探索'
      : '轻触书房或酒保，开始探索';
  }

  function finishGuidance(state: 'complete' | 'dismissed' | 'skipped') {
    guidanceTimers.forEach(timer => clearTimeout(timer));
    guidanceTimers = [];
    guidanceQueued = false;
    destinations.forEach(destination => { destination.guiding = false; });
    room.dataset.guidance = state;
    renderSignals();
  }

  function dismissGuidance() {
    if (room.dataset.guidance !== 'pending' && room.dataset.guidance !== 'showing') return;
    rememberGuidance();
    finishGuidance('dismissed');
  }

  function startGuidance() {
    if (guidanceSeen || guidanceQueued || !motionAvailable() || !image.naturalWidth) return;
    guidanceQueued = true;
    guidanceTimers.push(window.setTimeout(() => {
      guidanceQueued = false;
      if (!motionAvailable()) return;
      rememberGuidance();
      room.dataset.guidance = 'showing';
      destinations[0].guiding = true;
      renderSignals();
      // A single, brief pair of lights explains the two entrances without moving them.
      guidanceTimers.push(window.setTimeout(() => {
        destinations[1].guiding = true;
        renderSignals();
      }, 80));
      guidanceTimers.push(window.setTimeout(() => finishGuidance('complete'), 1450));
    }, 80));
  }

  function clearProximity() {
    if (pointerFrame) cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerPosition = null;
    destinations.forEach(destination => { destination.proximity = 0; });
  }

  function updateProximity() {
    pointerFrame = 0;
    if (!motionAvailable() || !pointer.matches || !pointerPosition) {
      destinations.forEach(destination => { destination.proximity = 0; });
      renderSignals();
      return;
    }
    for (const destination of destinations) {
      const bounds = destination.bounds;
      if (!bounds) continue;
      const dx = Math.max(bounds.left - pointerPosition.x, 0, pointerPosition.x - bounds.right);
      const dy = Math.max(bounds.top - pointerPosition.y, 0, pointerPosition.y - bounds.bottom);
      const reach = Math.min(140, Math.max(64, bounds.width * .22));
      const approach = Math.max(0, 1 - Math.hypot(dx, dy) / reach);
      destination.proximity = approach * approach;
    }
    renderSignals();
  }

  function queueProximity() {
    if (!pointerFrame) pointerFrame = requestAnimationFrame(updateProximity);
  }

  function fitScene() {
    if (!image.naturalWidth) return;
    const ratio = image.naturalWidth / image.naturalHeight;
    // Limit side cropping so the study and storyteller remain reachable.
    const width = Math.min(Math.max(room.clientWidth, room.clientHeight * ratio), room.clientWidth * 1.2);
    canvas.style.width = width + 'px';
    canvas.style.height = width / ratio + 'px';
    canvas.style.marginTop = width / ratio > room.clientHeight * 1.5 ? width / ratio * .02 + 'px' : '0px';
    const bottom = room.getBoundingClientRect().bottom - 72;
    room.querySelectorAll<HTMLElement>('.destination-label').forEach(label => {
      label.style.bottom = '0px';
      label.style.bottom = Math.max(0, label.getBoundingClientRect().bottom - bottom) + 'px';
    });
    destinations.forEach(destination => { destination.bounds = destination.element.getBoundingClientRect(); });
    if (pointerPosition) queueProximity();
    startGuidance();
  }

  function clearPressed() {
    destinations.forEach(destination => { destination.pressed = false; });
  }

  function cancelNavigation() {
    if (navigation) clearTimeout(navigation.timer);
    navigation = null;
    room.dataset.navigation = 'idle';
    delete room.dataset.navigationDestination;
    clearPressed();
    renderSignals();
  }

  function updateMotion() {
    const stopped = paused || reduce.matches;
    room.classList.toggle('room-paused', stopped || document.hidden);
    room.dataset.motion = document.hidden ? 'hidden' : reduce.matches ? 'reduced' : paused ? 'paused' : 'playing';
    toggle.disabled = reduce.matches;
    toggle.setAttribute('aria-pressed', String(stopped));
    const label = reduce.matches ? '已按系统设置减少动态效果' : stopped ? '播放环境动画' : '暂停环境动画';
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    toggle.querySelector('span')!.textContent = stopped ? '▷' : 'Ⅱ';
    if (!motionAvailable()) {
      cancelNavigation();
      clearProximity();
      if (room.dataset.guidance === 'showing') finishGuidance('dismissed');
      else if (!guidanceSeen && !document.hidden) {
        rememberGuidance();
        finishGuidance('skipped');
      }
    } else startGuidance();
    renderSignals();
  }

  function destinationAt(target: EventTarget | null) {
    return target instanceof Element
      ? destinations.find(destination => destination.element.contains(target)) ?? null
      : null;
  }

  room.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !pointer.matches || !motionAvailable()) return;
    room.dataset.input = 'pointer';
    focused = null;
    dismissGuidance();
    pointerPosition = { x: event.clientX, y: event.clientY };
    queueProximity();
  }, { passive: true });
  room.addEventListener('pointerleave', () => {
    clearProximity();
    renderSignals();
  });
  room.addEventListener('dragstart', cancelNavigation);
  document.addEventListener('pointerdown', event => {
    cancelNavigation();
    room.dataset.input = 'pointer';
    focused = null;
    const destination = destinationAt(event.target);
    if (destination) {
      dismissGuidance();
      if (event.button === 0 && event.isPrimary && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) destination.pressed = true;
    }
    renderSignals();
  }, { capture: true, passive: true });
  document.addEventListener('pointerup', () => { clearPressed(); renderSignals(); }, { passive: true });
  document.addEventListener('pointercancel', cancelNavigation, { passive: true });
  document.addEventListener('keydown', () => {
    // Keyboard navigation remains immediate; any key also interrupts a pending pointer exit.
    room.dataset.input = 'keyboard';
    cancelNavigation();
    clearProximity();
    dismissGuidance();
    renderSignals();
  });
  room.addEventListener('focusin', event => {
    const destination = destinationAt(event.target);
    focused = destination?.element.matches(':focus-visible') ? destination : null;
    if (focused) {
      room.dataset.input = 'keyboard';
      clearProximity();
      dismissGuidance();
    }
    renderSignals();
  });
  room.addEventListener('focusout', event => {
    if (focused && (!(event.relatedTarget instanceof Node) || !focused.element.contains(event.relatedTarget))) focused = null;
    renderSignals();
  });

  for (const destination of destinations) {
    destination.element.addEventListener('click', event => {
      dismissGuidance();
      const link = destination.element;
      const url = new URL(link.href, location.href);
      const nativeClick = event.defaultPrevented || event.button !== 0 || event.detail === 0 || room.dataset.input === 'keyboard'
        || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey
        || link.hasAttribute('download') || (link.target && link.target.toLowerCase() !== '_self')
        || url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)
        || (url.pathname === location.pathname && url.search === location.search);
      if (nativeClick || !motionAvailable()) {
        cancelNavigation();
        return;
      }
      event.preventDefault();
      cancelNavigation();
      destination.pressed = true;
      room.dataset.navigation = 'leaving';
      room.dataset.navigationDestination = destination.name;
      renderSignals();
      // Only an ordinary pointer click gets this short exit; links retain all native alternatives.
      navigation = {
        timer: window.setTimeout(() => {
          navigation = null;
          location.assign(url.href);
        }, 140),
      };
    });
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('bit-tavern-room-motion', paused ? 'paused' : 'playing'); } catch {}
    updateMotion();
  });
  reduce.addEventListener('change', updateMotion);
  pointer.addEventListener('change', () => {
    clearProximity();
    updateHint();
    renderSignals();
  });
  document.addEventListener('visibilitychange', updateMotion);
  addEventListener('blur', () => { cancelNavigation(); clearProximity(); renderSignals(); });
  addEventListener('pagehide', () => {
    cancelNavigation();
    clearProximity();
    focused = null;
    if (room.dataset.guidance === 'showing') finishGuidance('dismissed');
    else {
      guidanceTimers.forEach(timer => clearTimeout(timer));
      guidanceTimers = [];
      guidanceQueued = false;
    }
    renderSignals();
  });
  addEventListener('pageshow', () => {
    cancelNavigation();
    fitScene();
    updateMotion();
  });
  addEventListener('scroll', () => {
    destinations.forEach(destination => { destination.bounds = destination.element.getBoundingClientRect(); });
    if (pointerPosition) queueProximity();
  }, { passive: true });
  image.addEventListener('load', fitScene);
  new ResizeObserver(fitScene).observe(room);
  document.fonts.ready.then(fitScene);
  room.dataset.homeEnhanced = 'true';
  room.dataset.guidance = guidanceSeen ? 'seen' : 'pending';
  updateHint();
  updateMotion();
  fitScene();
}

export {};
