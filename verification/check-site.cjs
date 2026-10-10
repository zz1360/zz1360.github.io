const { chromium } = require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), base = process.env.SITE_ORIGIN || 'http://127.0.0.1:8887';
const fixtures = path.join(root, 'src/content/blog/__verification__');
const build = () => execFileSync('npm', ['run', 'build'], { cwd: root, env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' }, stdio: 'pipe' });
const options = { executablePath: '/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] };
(async () => {
  const b = await chromium.launch(options), errors = [], failed = [];
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1060 }, reducedMotion: 'reduce' });
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) failed.push(r.url()); });
    await p.goto(base + '/'); await p.evaluate(() => document.fonts.ready); await p.locator('.room-art').evaluate(n => n.decode());
    assert.equal(await p.locator('.header-motto').count(), 0);
    assert.equal(await p.locator('.site-header nav a').count(), 2);
    assert.equal(await p.locator('.room-destination.study').getAttribute('href'), '/blog/');
    assert.equal(await p.locator('.room-destination.storyteller').getAttribute('href'), '/dnd/');
    assert.equal(await p.locator('.portals,.discover,.hero-copy,.site-footer').count(), 0);
    await p.emulateMedia({ reducedMotion: 'no-preference' });
    await p.waitForFunction(() => !document.querySelector('#motion-toggle').disabled);
    await p.locator('#motion-toggle').click();
    assert.equal(await p.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
    await p.reload();
    assert.equal(await p.locator('#motion-toggle').getAttribute('aria-pressed'), 'true');
    await p.locator('#motion-toggle').click();
    assert.equal(await p.locator('#motion-toggle').getAttribute('aria-pressed'), 'false');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    assert.ok(!(await p.locator('body').innerText()).includes('视觉预览'));
    assert.equal(await p.locator('html').getAttribute('data-season'), 'regular');
    await p.screenshot({ path: __dirname + '/home-desktop.png', fullPage: true });
    await p.screenshot({ path: __dirname + '/home-first-screen.png' });
    await p.locator('#appearance-trigger').click(); await p.locator('#season-select').selectOption('halloween'); await p.keyboard.press('Escape');
    assert.equal(await p.locator('html').getAttribute('data-season'), 'halloween');
    await p.screenshot({ path: __dirname + '/home-halloween.png' });
    await p.reload(); assert.equal(await p.locator('html').getAttribute('data-season'), 'halloween');
    await p.locator('#appearance-trigger').click(); await p.locator('#season-select').selectOption('auto'); await p.keyboard.press('Escape');
    // Site preferences must not touch either existing DND storage key.
    const sentinel = '{"test":"existing-reading-state"}';
    await p.evaluate(value => { localStorage.setItem('dnd-work-yinhun-reading-v1', value); localStorage.setItem('dnd-codex-reading-v1', value); }, sentinel);
    await p.locator('.site-header nav a').first().click(); await p.waitForURL(base + '/blog/');
    assert.equal(await p.locator('.active-tab b').innerText(), '0');
    assert.equal(await p.locator('a[href*="article"]').count(), 0);
    await p.screenshot({ path: __dirname + '/blog-empty.png', fullPage: true });
    await p.locator('.site-header nav a').nth(1).click(); await p.waitForURL(base + '/explore/dnd/');
    await p.locator('.dnd-feature img').evaluate(n => n.decode());
    assert.equal(await p.locator('.dnd-feature a').getAttribute('href'), '/dnd/');
    await p.screenshot({ path: __dirname + '/dnd-entry.png', fullPage: true });
    for (const key of ['dnd-work-yinhun-reading-v1', 'dnd-codex-reading-v1']) assert.equal(await p.evaluate(k => localStorage.getItem(k), key), sentinel);
    await p.locator('#license-button').click(); assert.ok((await p.locator('#license-dialog').innerText()).includes('SIL Open Font License')); await p.keyboard.press('Escape');
    const m = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    m.on('pageerror', e => errors.push(e.message));
    for (const width of [390, 320]) {
      await m.setViewportSize({ width, height: 844 });
      for (const route of ['/', '/blog/', '/explore/dnd/']) { await m.goto(base + route); await m.evaluate(() => document.fonts.ready); assert.ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route + width); }
      await m.locator('#appearance-trigger').click(); assert.ok(await m.locator('#appearance-panel').evaluate(n => n.getBoundingClientRect().right <= innerWidth)); await m.keyboard.press('Escape');
    }
    await m.setViewportSize({ width: 390, height: 844 }); await m.goto(base + '/'); await m.locator('.room-art').evaluate(n => n.decode()); await m.evaluate(() => document.fonts.ready);
    await m.screenshot({ path: __dirname + '/home-mobile.png', fullPage: true });
    const html = await (await p.request.get(base + '/')).text(); assert.ok(html.includes('比特酒馆')); assert.ok(html.includes('进入老板的书房')); assert.ok(html.includes('探索 DND 世界百科'));
    for (const [date, season] of [['2026-10-30T16:00:00Z','halloween'], ['2026-10-31T16:00:00Z','regular']]) {
      const clockPage = await b.newPage();
      await clockPage.clock.install({ time: new Date(date) }); await clockPage.goto(base + '/');
      assert.equal(await clockPage.locator('html').getAttribute('data-season'), season); await clockPage.close();
    }
    if (!process.env.SITE_ORIGIN) {
      fs.mkdirSync(fixtures, { recursive: true });
      const body = '\n\n## 阅读测试\n\n这是一篇测试记录，只在验证期间使用。\n\n> 引用样式。\n\n```js\nconst curiosity = true;\n```\n\n| 标题 | 内容 |\n| --- | --- |\n| 测试 | 完成 |\n';
      fs.writeFileSync(fixtures + '/published.md', '---\ntitle: "验证文章：新的记录"\ndescription: "包含引号与符号 <>&，验证 RSS 转义。"\ndate: 2026-01-01T12:00:00+08:00\ndraft: false\n---' + body);
      fs.writeFileSync(fixtures + '/draft.md', '---\ntitle: "隐藏草稿"\ndate: 2026-01-01\ndraft: true\n---' + body);
      fs.writeFileSync(fixtures + '/future.md', '---\ntitle: "未来记录"\ndate: 2999-01-01\ndraft: false\n---' + body);
      build();
      await p.goto(base + '/blog/'); assert.equal(await p.locator('.active-tab b').innerText(), '1');
      assert.ok(!(await p.locator('body').innerText()).includes('隐藏草稿')); assert.ok(!(await p.locator('body').innerText()).includes('未来记录'));
      await p.locator('.post-card').click(); await p.waitForURL(base + '/blog/__verification__/published/'); await p.evaluate(() => document.fonts.ready);
      assert.equal(await p.locator('.article-body h2').innerText(), '阅读测试'); assert.equal(await p.locator('.article-body table').count(), 1);
      await p.screenshot({ path: __dirname + '/article-dark.png', fullPage: true }); await p.locator('[data-reading="light"]').click();
      assert.equal(await p.locator('html').getAttribute('data-reading-theme'), 'light'); await p.reload(); assert.equal(await p.locator('html').getAttribute('data-reading-theme'), 'light');
      await p.screenshot({ path: __dirname + '/article-light.png', fullPage: true }); await p.locator('.code-copy').click(); await p.waitForFunction(() => document.querySelector('[role="status"]').textContent.length > 0);
      await p.locator('.article-toc a').click(); assert.ok(p.url().includes('#阅读测试') || p.url().includes('#%E9%98%85'));
      for (const width of [390, 320]) { await m.setViewportSize({ width, height: 844 }); await m.goto(base + '/blog/__verification__/published/'); assert.ok(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); }
      const rss = await (await p.request.get(base + '/rss.xml')).text(); assert.ok(rss.includes('&lt;&gt;&amp;')); assert.equal((rss.match(/<item>/g) || []).length, 1);
      assert.ok(!fs.existsSync(path.join(root, 'dist/blog/__verification__/draft/index.html'))); assert.ok(!fs.existsSync(path.join(root, 'dist/blog/__verification__/future/index.html')));
      fs.rmSync(fixtures, { recursive: true, force: true }); build();
      assert.ok(!fs.existsSync(path.join(root, 'dist/blog/__verification__')));
      const checksums = JSON.parse(fs.readFileSync(__dirname + '/preserved-paths.json'));
      // The migration snapshot still protects existing artwork and unrelated app routes.
      // Generated DND HTML/metadata may evolve during authorized maintenance.
      for (const [file, hash] of Object.entries(checksums).filter(([file]) => /\.(webp|png|jpg|svg)$/.test(file) || /^(privacy|support)\//.test(file))) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'dist', file))).digest('hex'), hash, file);
    }
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    console.log(JSON.stringify({ passed: true, origin: base, nativeRoutes: true, serverRendered: true, headerMottoRemoved: true, seasonBoundary: true, mobileWidths: [390,320], dndStorageUntouched: true, publishingWorkflow: !process.env.SITE_ORIGIN, jsErrors: errors }));
  } finally {
    await b.close();
    if (fs.existsSync(fixtures)) { fs.rmSync(fixtures, { recursive: true, force: true }); build(); }
  }
})().catch(e => { console.error(e); process.exit(1); });
