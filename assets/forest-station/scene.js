(() => {
  'use strict';

  const assetRoot = '/assets/forest-station/';
  const seasonKey = 'bit-tavern-station-season';
  const root = document.querySelector('#scene');
  const page = document.documentElement;
  const photoLayer = root.querySelector('.background-photos');
  const sign = root.querySelector('.station-sign');
  const routeDialog = root.querySelector('.route-dialog');
  const seasonControl = root.querySelector('.season-control');
  const choices = seasonControl.querySelectorAll('[data-season-choice]');
  const stationImages = new Map(Array.from(choices, choice => [choice.dataset.seasonChoice, choice.dataset.stationImage]));
  const status = seasonControl.querySelector('.station-status');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 800px)');
  const vehicle = document.querySelector('#vehicle');
  let picture = document.querySelector('#vehicle-image');
  const wheels = [document.querySelector('#wheel-1'), document.querySelector('#wheel-2')];
  const next = document.querySelector('#next');
  const toggle = document.querySelector('#motion');
  const speedInput = document.querySelector('#speed');
  const speedValue = document.querySelector('#speed-value');

  const models = [
    { id: 'red', w: 1774, h: 887, r: 137, centers: [[390, 651, 132], [1412, 653, 133]], desktop: 900, mobile: 1405, bottom: .91 },
    { id: 'blue', w: 1944, h: 809, r: 135, centers: [[437, 631, 127], [1561, 632, 128]], desktop: 1050, mobile: 1500, bottom: .97 },
    { id: 'bus', w: 2172, h: 724, r: 116, centers: [[569, 604, 108], [1738, 602, 109]], desktop: 1930, mobile: 2690, bottom: .99 },
  ];
  const baseSpeed = 120;
  const vehicleGap = 9;
  const ads = ['soda', 'post'];
  const pages = ['stations', ...ads];
  const posters = { soda: 'ad-moonlight.webp', post: 'ad-post.webp' };

  const images = new Map();
  function prepareImage(filename, priority = 'low') {
    if (!images.has(filename)) {
      const image = new Image();
      image.fetchPriority = priority;
      image.decoding = 'async';
      image.src = assetRoot + filename;
      images.set(filename, image.decode().then(() => image, () => {
        images.delete(filename);
        return null;
      }));
    }
    return images.get(filename);
  }

  let activeSeason = stationImages.has(page.dataset.stationSeason) ? page.dataset.stationSeason : 'spring';
  let desiredSeason = activeSeason;
  let sceneRequest = 0;
  let sceneSettled = false;
  let showingPhoto;
  let pendingSeason = false;

  function updateSeasonControls() {
    for (const choice of choices) {
      choice.setAttribute('aria-pressed', String(choice.dataset.seasonChoice === activeSeason));
    }
    seasonControl.setAttribute('aria-busy', String(pendingSeason));
  }

  async function loadScene(season) {
    const request = ++sceneRequest;
    desiredSeason = season;
    pendingSeason = season !== activeSeason;
    status.textContent = pendingSeason ? '正在加载场景…' : '';
    updateSeasonControls();
    const filename = stationImages.get(season) + (mobile.matches ? '-mobile' : '') + '.webp';
    const decoded = await prepareImage(filename, 'high');
    if (request !== sceneRequest) return;

    if (decoded) {
      const previous = showingPhoto;
      activeSeason = season;
      page.dataset.stationSeason = season;
      if (previous !== decoded) {
        decoded.className = 'background-photo';
        decoded.alt = '';
        photoLayer.replaceChildren(...(previous ? [previous, decoded] : [decoded]));
        showingPhoto = decoded;
        const removePrevious = () => { if (previous !== showingPhoto) previous?.remove(); };
        if (!reducedMotion.matches && !paused) {
          const fade = decoded.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
          fade.finished.then(removePrevious, removePrevious);
        } else {
          removePrevious();
        }
      }
      if (pendingSeason) {
        try { localStorage.setItem(seasonKey, season); } catch {}
      }
    } else if (pendingSeason) {
      status.textContent = '场景加载失败，可再次尝试';
    }
    if (decoded || !pendingSeason) status.textContent = '';
    desiredSeason = activeSeason;
    pendingSeason = false;
    updateSeasonControls();
    if (!sceneSettled) {
      sceneSettled = true;
      startTraffic();
      scheduleAd();
    }
  }

  let paused = reducedMotion.matches;
  let index = 0;
  let progress = .12;
  let last = 0;
  let frame = 0;
  let rest = 0;
  let cover = 1;
  let speedFactor = Number(speedInput.value);
  let vehicleLoading = false;
  let preloadNext = false;

  function syncMotion() {
    const stopped = paused || document.hidden;
    root.classList.toggle('paused', stopped);
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '播放动画' : '暂停动画';
    speedInput.setAttribute('aria-valuetext', speedFactor.toFixed(1) + ' 倍');
    next.disabled = paused || vehicleLoading || !sceneSettled;
  }

  function vehicleFilename(model) {
    return model.id + '-layered.png';
  }

  function prepareVehicle(model) {
    const filenames = [vehicleFilename(model), 'window-' + model.id + '.svg'];
    if (model.id === 'bus') filenames.push('bus-glass.svg');
    return Promise.all(filenames.map(filename => prepareImage(filename)));
  }

  function setupWheel(wheel, model, center) {
    // The same image supplies both the car body and the cutout rotating tire.
    const [x, y, radius] = center;
    const diameter = radius * 2;
    wheel.style.width = (100 * diameter / model.w) + '%';
    wheel.style.left = (100 * (x - radius) / model.w) + '%';
    wheel.style.top = (100 * (y - radius) / model.h) + '%';
    wheel.style.backgroundImage = 'url("' + assetRoot + vehicleFilename(model) + '")';
    wheel.style.backgroundSize = (100 * model.w / diameter) + '% auto';
    wheel.style.backgroundPosition = (100 * (x - radius) / (model.w - diameter)) + '% ' +
      (100 * (y - radius) / (model.h - diameter)) + '%';
  }

  function sizeVehicle() {
    const model = models[index];
    const width = (mobile.matches ? model.mobile : model.desktop) * cover;
    const height = width * model.h / model.w;
    const sceneHeight = root.clientHeight;
    const top = (sceneHeight - (mobile.matches ? 1672 : 941) * cover) / 2;
    const road = top + (mobile.matches ? 1605 : 908) * cover;
    vehicle.style.setProperty('--vehicle-width', width + 'px');
    vehicle.style.setProperty('--vehicle-bottom', (sceneHeight - road - (1 - model.bottom) * height) + 'px');
    vehicle.style.setProperty('--wheel-period', (2 * Math.PI * model.r * width / model.w / baseSpeed) + 's');
  }

  function updateWheelSpeed() {
    for (const wheel of wheels) {
      for (const animation of wheel.getAnimations()) animation.updatePlaybackRate(speedFactor);
    }
  }

  function draw() {
    if (vehicle.hidden) return;
    const width = vehicle.offsetWidth;
    const distance = root.clientWidth + width * 1.3;
    vehicle.style.transform = 'translate3d(' + (-width * 1.15 + distance * progress) + 'px,0,0)';
  }

  async function selectVehicle(startIndex, startProgress = 0) {
    vehicleLoading = true;
    syncMotion();
    for (let attempt = 0; attempt < models.length; attempt++) {
      const candidateIndex = (startIndex + attempt) % models.length;
      const model = models[candidateIndex];
      const [body, mask, glass] = await prepareVehicle(model);
      if (!body || !mask || (model.id === 'bus' && !glass)) continue;

      index = candidateIndex;
      body.id = 'vehicle-image';
      body.className = 'vehicle-image';
      body.alt = '';
      body.style.setProperty('--window-mask', 'url("' + mask.src + '")');
      if (body !== picture) {
        picture.replaceWith(body);
        picture = body;
      }
      vehicle.classList.toggle('bus', model.id === 'bus');
      wheels.forEach((wheel, i) => setupWheel(wheel, model, model.centers[i]));
      progress = startProgress;
      rest = 0;
      preloadNext = false;
      sizeVehicle();
      vehicle.hidden = false;
      draw();
      updateWheelSpeed();
      vehicleLoading = false;
      syncMotion();
      wake();
      return;
    }

    vehicleLoading = false;
    rest = 0;
    syncMotion();
    if (!vehicle.hidden) wake();
  }

  function startTraffic() {
    window.requestAnimationFrame(() => selectVehicle(0, .12));
  }

  function step(time) {
    frame = 0;
    if (paused || document.hidden || vehicle.hidden) return;
    const delta = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    if (progress < 1) {
      const distance = root.clientWidth + vehicle.offsetWidth * 1.3;
      progress = Math.min(1, progress + delta * baseSpeed * speedFactor / distance);
      draw();
      if (progress >= .55 && !preloadNext) {
        preloadNext = true;
        prepareVehicle(models[(index + 1) % models.length]);
      }
    } else {
      rest += delta;
      if (rest >= vehicleGap && !vehicleLoading) {
        selectVehicle((index + 1) % models.length);
        return;
      }
    }
    frame = requestAnimationFrame(step);
  }

  function wake() {
    if (frame || paused || document.hidden || vehicle.hidden) return;
    last = 0;
    frame = requestAnimationFrame(step);
  }

  function stopTraffic() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  }

  function fitVehicle() {
    const width = mobile.matches ? 941 : 1672;
    const height = mobile.matches ? 1672 : 941;
    cover = Math.max(root.clientWidth / width, root.clientHeight / height);
    sizeVehicle();
    draw();
  }

  let screen = 'stations';
  let adIndex = 0;
  let adTimer = 0;
  let autoToken = 0;
  let manualToken = 0;
  let pointer;
  let hovering = false;
  let suppressClick = false;
  let wheelAt = 0;

  function cancelAd() {
    clearTimeout(adTimer);
    autoToken++;
  }

  function canRotateAds() {
    return sceneSettled && !paused && !document.hidden && !hovering &&
      !pointer && !sign.hasAttribute('aria-busy') && !routeDialog.open && !sign.contains(document.activeElement);
  }

  async function preparePoster(name) {
    const photo = await prepareImage(posters[name]);
    if (!photo) return false;
    sign.querySelector('[data-screen="' + name + '"]').style.setProperty('--poster-image', 'url("' + photo.src + '")');
    return true;
  }

  function showScreen(name) {
    const focused = document.activeElement;
    const focusWasInScreen = sign.querySelector('[data-screen="' + screen + '"]').contains(focused);
    screen = name;
    sign.dataset.active = name;
    sign.querySelectorAll('[data-screen]').forEach(panel => { panel.hidden = panel.dataset.screen !== name; });
    sign.querySelectorAll('[data-page]').forEach(dot => {
      if (dot.dataset.page === name) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (focusWasInScreen && focused.closest('[hidden]')) sign.focus({ preventScroll: true });
  }

  function scheduleAd(delay = 9000) {
    cancelAd();
    if (!canRotateAds()) return;
    const token = autoToken;
    const name = ads[adIndex];
    if (screen === 'stations') preparePoster(name);
    adTimer = setTimeout(async () => {
      if (token !== autoToken || !canRotateAds()) return;
      if (screen !== 'stations') {
        showScreen('stations');
        scheduleAd();
        return;
      }

      // An unready poster never replaces the map, even if its display time arrives.
      const ready = await preparePoster(name);
      if (token !== autoToken || !canRotateAds()) return;
      adIndex = (adIndex + 1) % ads.length;
      if (ready) showScreen(name);
      scheduleAd(ready ? 6000 : 9000);
    }, delay);
  }

  async function goTo(name) {
    cancelAd();
    const token = ++manualToken;
    sign.removeAttribute('aria-busy');
    if (name !== 'stations') {
      sign.setAttribute('aria-busy', 'true');
      const ready = await preparePoster(name);
      if (token !== manualToken) return;
      sign.removeAttribute('aria-busy');
      if (!ready) {
        showScreen('stations');
        scheduleAd(12000);
        return;
      }
    }
    showScreen(name);
    scheduleAd(12000);
  }

  function moveScreen(direction) {
    goTo(pages[(pages.indexOf(screen) + direction + pages.length) % pages.length]);
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    syncMotion();
    if (paused) {
      cancelAd();
      stopTraffic();
    } else {
      scheduleAd();
      wake();
    }
  });
  next.addEventListener('click', () => {
    if (!paused && !vehicleLoading) selectVehicle((index + 1) % models.length);
  });
  speedInput.addEventListener('input', () => {
    speedFactor = Number(speedInput.value);
    speedValue.textContent = speedFactor.toFixed(1) + '×';
    speedInput.setAttribute('aria-valuetext', speedFactor.toFixed(1) + ' 倍');
    updateWheelSpeed();
  });

  sign.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    cancelAd();
  });
  sign.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    if (pointer && !pointer.dragging) pointer = undefined;
    if (!sign.hasAttribute('aria-busy')) scheduleAd(12000);
  });
  sign.addEventListener('dragstart', event => event.preventDefault());
  sign.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.target.closest('.sign-nav')) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, dragging: false };
    cancelAd();
  });
  sign.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const x = Math.abs(event.clientX - pointer.x), y = Math.abs(event.clientY - pointer.y);
    if (!pointer.dragging && x > 12 && x > y) {
      pointer.dragging = true;
      sign.setPointerCapture(event.pointerId);
    }
  });
  sign.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const x = event.clientX - pointer.x, y = Math.abs(event.clientY - pointer.y);
    const dragging = pointer.dragging;
    pointer = undefined;
    if (dragging) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      if (Math.abs(x) > 32 && Math.abs(x) > y) {
        moveScreen(x < 0 ? 1 : -1);
        return;
      }
    }
    if (!sign.hasAttribute('aria-busy')) scheduleAd(12000);
  });
  sign.addEventListener('pointercancel', () => { pointer = undefined; scheduleAd(12000); });
  sign.addEventListener('click', event => {
    if (!suppressClick) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  sign.addEventListener('wheel', event => {
    event.preventDefault();
    const now = Date.now();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) > 3 && now - wheelAt > 450) {
      wheelAt = now;
      moveScreen(delta > 0 ? 1 : -1);
    }
  }, { passive: false });
  sign.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    moveScreen(event.key === 'ArrowRight' ? 1 : -1);
  });
  sign.querySelector('.sign-prev').addEventListener('click', () => moveScreen(-1));
  sign.querySelector('.sign-next').addEventListener('click', () => moveScreen(1));
  sign.querySelector('.map-trigger').addEventListener('click', () => {
    cancelAd();
    manualToken++;
    sign.removeAttribute('aria-busy');
    routeDialog.showModal();
  });
  routeDialog.querySelector('.route-close').addEventListener('click', () => routeDialog.close());
  routeDialog.addEventListener('close', () => scheduleAd(12000));
  sign.querySelectorAll('.fictional-ad').forEach(ad => ad.addEventListener('click', () => goTo('stations')));
  sign.addEventListener('focusin', cancelAd);
  sign.addEventListener('focusout', () => setTimeout(() => {
    if (!sign.contains(document.activeElement) && !sign.hasAttribute('aria-busy')) scheduleAd(12000);
  }, 0));

  for (const choice of choices) {
    choice.addEventListener('click', () => {
      if (choice.dataset.seasonChoice !== desiredSeason || !showingPhoto) loadScene(choice.dataset.seasonChoice);
    });
  }
  reducedMotion.addEventListener('change', () => {
    paused = reducedMotion.matches;
    syncMotion();
    if (paused) {
      cancelAd();
      stopTraffic();
    } else {
      scheduleAd();
      wake();
    }
  });
  document.addEventListener('visibilitychange', () => {
    syncMotion();
    if (document.hidden) {
      cancelAd();
      stopTraffic();
    } else {
      scheduleAd();
      wake();
    }
  });
  window.addEventListener('resize', fitVehicle, { passive: true });
  mobile.addEventListener('change', () => {
    photoLayer.replaceChildren();
    showingPhoto = undefined;
    loadScene(desiredSeason);
  });

  syncMotion();
  fitVehicle();
  updateSeasonControls();
  seasonControl.hidden = false;
  loadScene(activeSeason);
})();
