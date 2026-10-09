const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_ORIGIN||'http://127.0.0.1:8897';
const appearance='dnd-world-appearance-v1',reading='dnd-codex-reading-v1',novel='dnd-work-yinhun-reading-v1';
(async()=>{
 const browser=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
 const page=await browser.newPage({viewport:{width:2048,height:1280},reducedMotion:'reduce'}),errors=[],failures=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failures.push(r.url())});
 const figure=side=>page.locator(`.goddess[data-side="${side}"]`);
 async function chosen(side,id){await page.waitForFunction(({side,id})=>{const n=document.querySelector(`.goddess[data-side="${side}"]`),img=n.querySelector('img');return n.dataset.character===id&&img.complete&&img.naturalWidth>1&&img.currentSrc.includes(`/companion-${id}-`)},{side,id});await figure(side).locator('img').evaluate(img=>img.decode())}
 try{
  await page.addInitScript(({reading,novel})=>{localStorage.setItem(reading,JSON.stringify({saved:['shar'],recent:[]}));localStorage.setItem(novel,JSON.stringify({mode:'progress',limit:3,saved:[],recent:[]}))},{reading,novel});
  const requests=[];page.on('request',r=>{if(r.url().includes('/companion-'))requests.push(r.url())});
  await page.goto(base+'/dnd/#atlas');await chosen('left','mystra');await chosen('right','shar');
  const originals=await page.evaluate(({reading,novel})=>[localStorage.getItem(reading),localStorage.getItem(novel)],{reading,novel});
  assert.ok(requests.every(url=>/companion-(mystra|shar)-/.test(url)),'unselected characters load only when requested');
  const ids=await page.evaluate(()=>JSON.parse(document.getElementById('companion-data').textContent).map(x=>x.id));assert.equal(ids.length,9);
  await page.locator('#main').evaluate(n=>n.scrollTop=380);const offset=await page.locator('#main').evaluate(n=>n.scrollTop),route=await page.evaluate(()=>location.hash);
  await page.locator('#companion-picker').click();assert.equal(await page.locator('.companion-option').count(),9);
  for(const side of ['left','right']){
   await page.locator(`[data-pick-side="${side}"]`).click();
   for(const id of ids){
    await page.locator(`.companion-option[data-character="${id}"]`).click();await chosen(side,id);
    assert.equal(await page.locator(`.companion-option[data-character="${id}"]`).getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#main').evaluate(n=>n.scrollTop),offset);assert.equal(await page.evaluate(()=>location.hash),route);
    assert.ok(await figure(side).locator('img').evaluate(img=>{const r=img.getBoundingClientRect();return img.naturalWidth>0&&r.top>=0&&r.bottom<=innerHeight+1&&getComputedStyle(img).objectFit==='contain'}));
   }
  }
  await page.locator('[data-pick-side="left"]').click();await page.locator('.companion-option[data-character="selune"]').click();await chosen('left','selune');
  await page.locator('[data-pick-side="right"]').click();await page.locator('.companion-option[data-character="lolth"]').click();await chosen('right','lolth');
  await page.keyboard.press('Escape');assert.ok(!await page.locator('#companion-dialog').evaluate(d=>d.open));
  assert.equal(await page.locator('.goddess figcaption').count(),0);
  await page.screenshot({path:__dirname+'/companions-desktop.png'});
  await figure('left').hover();await figure('left').locator('.next').click();await chosen('left','laeral');assert.equal(await figure('right').getAttribute('data-character'),'lolth');
  await figure('right').hover();await figure('right').locator('.next').click();await chosen('right','zariel');await figure('right').locator('.next').click();await chosen('right','mystra');
  assert.equal(await figure('right').getAttribute('data-mirror'),'true');
  await page.locator('#theme-button').click();await page.locator('#layout-select').selectOption('original');await page.reload();
  assert.equal(await page.locator('#layout-select').inputValue(),'original');assert.ok(await page.locator('body').evaluate(n=>n.classList.contains('light')));
  await page.locator('#layout-select').selectOption('companions');await chosen('left','laeral');await chosen('right','mystra');
  assert.deepEqual(await page.evaluate(({reading,novel})=>[localStorage.getItem(reading),localStorage.getItem(novel)],{reading,novel}),originals);
  await page.locator('#companion-picker').click();await page.keyboard.press('Control+k');assert.ok(!await page.locator('#search-dialog').evaluate(d=>d.open));
  await page.locator('#companion-reset').click();await chosen('left','mystra');await chosen('right','shar');
  await page.screenshot({path:__dirname+'/companions-picker.png'});await page.locator('#companion-dialog [data-close]').click();
  for(const width of [2048,1850,1751,1440,1280,1024,390,320]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const header=await page.locator('.topbar').boundingBox(),nav=await page.locator('.nav').boundingBox();assert.ok(nav.y+nav.height<=header.y+header.height+1);
   if(width<=1100)assert.equal(await page.locator('#companion-picker:visible').count(),0);
  }
  const fresh=await browser.newPage({viewport:{width:1440,height:900}}),onlySelected=[];
  await fresh.addInitScript(key=>localStorage.setItem(key,JSON.stringify({layout:'companions',light:false,left:'tasha',right:'alustriel'})),appearance);
  fresh.on('request',r=>{if(r.url().includes('/companion-'))onlySelected.push(r.url())});await fresh.goto(base+'/dnd/');await fresh.waitForFunction(()=>[...document.querySelectorAll('.goddess img')].every(img=>img.complete&&img.naturalWidth>1&&img.currentSrc.includes('/companion-')));await fresh.locator('.goddess img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  assert.ok(onlySelected.length>0&&onlySelected.every(url=>/companion-(tasha|alustriel)-/.test(url)),'reload does not first download default pair');await fresh.close();
  const pure=await browser.newPage({viewport:{width:1440,height:900}}),pureRequests=[];await pure.addInitScript(key=>localStorage.setItem(key,JSON.stringify({layout:'original',left:'tasha',right:'lolth'})),appearance);pure.on('request',r=>{if(r.url().includes('/companion-'))pureRequests.push(r.url())});await pure.goto(base+'/dnd/');assert.deepEqual(pureRequests,[]);await pure.close();
  const narrow=await browser.newPage({viewport:{width:390,height:844}}),mobileRequests=[];
  narrow.on('request',r=>{if(r.url().includes('/companion-'))mobileRequests.push(r.url())});await narrow.goto(base+'/dnd/');assert.deepEqual(mobileRequests,[]);await narrow.close();
  const invalid=await browser.newPage({viewport:{width:1440,height:900}});await invalid.addInitScript(key=>localStorage.setItem(key,JSON.stringify({layout:'companions',left:'missing',right:'<bad>'})),appearance);await invalid.goto(base+'/dnd/');assert.equal(await invalid.locator('[data-side="left"]').getAttribute('data-character'),'mystra');assert.equal(await invalid.locator('[data-side="right"]').getAttribute('data-character'),'shar');await invalid.close();
  const retry=await browser.newPage({viewport:{width:1440,height:900}});
  await retry.route('**/companion-tasha-*.webp',route=>route.abort());await retry.goto(base+'/dnd/');await retry.locator('#companion-picker').click();await retry.locator('.companion-option[data-character="tasha"]').click();await retry.waitForFunction(()=>document.getElementById('companion-dialog-status').textContent.includes('未加载成功'));
  assert.equal(await retry.locator('[data-side="left"]').getAttribute('data-character'),'mystra');await retry.unroute('**/companion-tasha-*.webp');await retry.locator('.companion-option[data-character="tasha"]').click();await retry.waitForFunction(()=>document.querySelector('[data-side="left"]').dataset.character==='tasha');await retry.close();
  const rapid=await browser.newPage({viewport:{width:1440,height:900}});let releaseSlow;
  const slow=new Promise(resolve=>releaseSlow=resolve);await rapid.route('**/companion-tasha-*.webp',async route=>{await slow;await route.continue()});await rapid.goto(base+'/dnd/');await rapid.locator('#companion-picker').click();await rapid.locator('.companion-option[data-character="tasha"]').click();await rapid.locator('.companion-option[data-character="selune"]').click();await rapid.waitForFunction(()=>document.querySelector('[data-side="left"]').dataset.character==='selune');releaseSlow();await rapid.waitForLoadState('networkidle');assert.equal(await rapid.locator('[data-side="left"]').getAttribute('data-character'),'selune');await rapid.close();
  const blocked=await browser.newPage({viewport:{width:1440,height:900}});blocked.on('pageerror',e=>errors.push(e.message));await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')}});await blocked.goto(base+'/dnd/');await blocked.locator('#companion-picker').click();await blocked.locator('.companion-option[data-character="alustriel"]').click();await blocked.waitForFunction(()=>document.querySelector('[data-side="left"]').dataset.character==='alustriel');await blocked.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
  const report={passed:true,origin:base,characters:ids,independentSides:true,arrows:true,fullBody:true,scrollPreserved:true,appearancePersistence:true,readingStatePreserved:true,onDemandImages:true,noMobilePortraitDownload:true,invalidChoicesFallback:true,failedImageRetry:true,latestChoiceWins:true,blockedStorage:true,errors,failures};
  fs.writeFileSync(__dirname+'/companions-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
