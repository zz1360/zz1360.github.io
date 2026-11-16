const assert = require('node:assert/strict');
const { chromium } = require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const origin = process.env.SITE_ORIGIN || 'http://127.0.0.1:8930';
const chrome = '/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

(async () => {
  const browser = await chromium.launch({ executablePath: chrome });
  const errors = [];
  try {
    for (const viewport of [{ width: 1600, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 700 }]) {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(origin) && response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
      await page.goto(origin + '/', { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.brand, .tavern-room').count(), 0);
      assert.deepEqual(await page.locator('.nav a').evaluateAll(links => links.map(link => new URL(link.href).pathname)), ['/blog/', '/dnd/']);
      const sign = page.locator('.station-sign');
      assert.equal(await sign.getAttribute('data-active'), 'stations');
      await page.locator('.map-trigger').click();
      assert.equal(await page.locator('.route-dialog').evaluate(dialog => dialog.open), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.route-dialog').evaluate(dialog => dialog.open), false);
      await page.locator('.sign-next').click();
      assert.equal(await sign.getAttribute('data-active'), 'soda');
      await page.locator('.sign-prev').click();
      assert.equal(await sign.getAttribute('data-active'), 'stations');
      const rect = await sign.boundingBox();
      await page.mouse.move(rect.x + rect.width * .75, rect.y + rect.height * .5);
      await page.mouse.down();
      await page.mouse.move(rect.x + rect.width * .2, rect.y + rect.height * .5, { steps: 6 });
      await page.mouse.up();
      assert.equal(await sign.getAttribute('data-active'), 'soda');
      assert.equal(await page.locator('.route-dialog').evaluate(dialog => dialog.open), false);
      assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
      const controls = await page.locator('footer > *').evaluateAll(elements => elements.map(element => {
        const r = element.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }));
      assert(controls.every(r => r.left >= 0 && r.right <= viewport.width && r.top >= 0 && r.bottom <= viewport.height));
      await page.close();
    }
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    await page.goto(origin + '/', { waitUntil: 'networkidle' });
    const sign = page.locator('.station-sign'), rect = await sign.boundingBox(), cdp = await page.context().newCDPSession(page);
    const y = rect.y + rect.height * .5, start = rect.x + rect.width * .8, end = rect.x + rect.width * .2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: start, y }] });
    for (let i = 1; i <= 6; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: start + (end - start) * i / 6, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await sign.getAttribute('data-active'), 'soda');
    await page.locator('.sign-prev').tap();
    await page.locator('.map-trigger').tap();
    assert.equal(await page.locator('.route-dialog').evaluate(dialog => dialog.open), true);
    await page.close();
    for (const url of ['/blog/', '/dnd/', '/assets/forest-station/station.webp']) {
      const response = await browser.newPage().then(async p => { const r = await p.goto(origin + url); await p.close(); return r.status(); });
      assert.equal(response, 200, url);
    }
    assert.deepEqual(errors, []);
    console.log('Forest home: desktop, mobile, routes, carousel, map and reduced motion passed.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
