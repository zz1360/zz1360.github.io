const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.SITE_ORIGIN||'http://127.0.0.1:8897';
const sizes=[[2048,1280],[1440,900],[1280,800],[1024,768],[390,844],[320,760],[844,390]];
(async()=>{
 const b=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const p=await b.newPage({reducedMotion:'reduce'}),errors=[],failed=[],results=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push(r.url())});
 try{
  await p.setViewportSize({width:2048,height:1280});await p.goto(base+'/dnd/#atlas');await p.evaluate(()=>document.fonts.ready);
  assert.equal(await p.locator('.rail').count(),0);assert.equal(await p.locator('.goddess figcaption').count(),0);assert.equal(await p.locator('.nav a[data-section]').count(),9);
  await p.waitForFunction(()=>[...document.querySelectorAll('.goddess-art')].every(img=>img.complete&&img.naturalWidth>1&&img.currentSrc.includes('/companion-')));
  await p.locator('.goddess-art').evaluateAll(ns=>Promise.all(ns.map(n=>n.decode())));await p.locator('#map-preview img').evaluate(n=>n.decode());
  await p.screenshot({path:__dirname+'/stage-desktop.png'});
  const figures=await p.locator('.goddess').evaluateAll(ns=>ns.map(n=>({y:n.getBoundingClientRect().y,h:n.getBoundingClientRect().height})));
  await p.locator('.mystra').hover();await p.mouse.wheel(0,500);await p.waitForTimeout(120);
  assert.ok(await p.locator('#main').evaluate(n=>n.scrollTop>0));assert.equal(await p.evaluate(()=>scrollY),0);
  assert.deepEqual(figures,await p.locator('.goddess').evaluateAll(ns=>ns.map(n=>({y:n.getBoundingClientRect().y,h:n.getBoundingClientRect().height}))));
  await p.locator('.reader-scrollbar').focus();await p.keyboard.press('Home');assert.equal(await p.locator('#main').evaluate(n=>n.scrollTop),0);
  const thumb=await p.locator('.scroll-thumb').boundingBox();await p.mouse.move(thumb.x+thumb.width/2,thumb.y+15);await p.mouse.down();await p.mouse.move(thumb.x+thumb.width/2,thumb.y+95);await p.mouse.up();assert.ok(await p.locator('#main').evaluate(n=>n.scrollTop>0));
  await p.locator('.nav a[data-section="people"]').click();assert.equal(await p.locator('#main').evaluate(n=>n.scrollTop),0);
  await p.goto(base+'/dnd/#art/mystra/2');assert.equal(await p.locator('#art-counter').innerText(),'3 / 4');await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#art-counter').innerText(),'4 / 4');await p.keyboard.press('Escape');
  await p.goto(base+'/dnd/#entry/shar');await p.locator('#entry-dialog [data-save]').click();await p.keyboard.press('Escape');
  const saved=await p.evaluate(()=>localStorage.getItem('dnd-codex-reading-v1'));
  for(const [width,height] of sizes){
   await p.setViewportSize({width,height});await p.goto(base+'/dnd/#atlas');
   for(const layout of ['companions','original']){
    await p.locator('#layout-select').selectOption(layout);
    for(const light of [false,true]){
     if(await p.locator('body').evaluate(n=>n.classList.contains('light'))!==light)await p.locator('#theme-button').click();
     for(const section of ['overview','worlds','cosmos','history','people','atlas','primer','sources','works']){
      await p.evaluate(id=>showSection(id),section);
      const fit=await p.evaluate(()=>({page:document.documentElement.scrollWidth<=innerWidth+1,main:document.getElementById('main').scrollWidth<=document.getElementById('main').clientWidth+1}));
      assert.ok(fit.page&&fit.main,`${width} ${layout} light=${light} ${section} overflow`);
     }
     if(layout==='original')assert.equal(await p.locator('body').evaluate(n=>getComputedStyle(n).getPropertyValue('--bg').trim()),light?'#eee9dc':'#101717');
     await p.evaluate(()=>showSection('atlas'));
     const rect=await p.locator('.topbar').boundingBox(),nav=await p.locator('.topbar .nav').boundingBox();assert.ok(nav.y+nav.height<=rect.y+rect.height+1,`${width} nav stays in header`);
     if(layout==='companions'){
      if(width>1100){for(const n of await p.locator('.goddess-art').all())assert.ok(await n.evaluate(n=>{const r=n.getBoundingClientRect();return r.top>=document.querySelector('.topbar').getBoundingClientRect().bottom-1&&r.bottom<=innerHeight+1&&getComputedStyle(n).objectFit==='contain'}))}
      else assert.equal(await p.locator('.goddess:visible').count(),0);
     }
     if(width===390&&layout==='companions'&&!light)await p.screenshot({path:__dirname+'/stage-mobile.png'});
    }
   }
   console.log(`Checked stage/original and dark/light at ${width} × ${height}`);results.push({width,height});
  }
  assert.equal(await p.evaluate(()=>localStorage.getItem('dnd-codex-reading-v1')),saved,'appearance switches preserve reading state');
  await p.setViewportSize({width:1440,height:900});await p.locator('#layout-select').selectOption('original');await p.reload();assert.equal(await p.locator('#layout-select').inputValue(),'original');assert.ok(await p.locator('body').evaluate(n=>n.classList.contains('light')));
  await p.locator('#layout-select').selectOption('companions');await p.reload();assert.equal(await p.locator('#layout-select').inputValue(),'companions');
  await p.locator('#theme-button').click();await p.goto(base+'/dnd/#entry/mystra');
  await p.locator('#entry-dialog .dialog-plate img').evaluate(n=>n.decode());await p.keyboard.press('Escape');
  await p.locator('#launch-search').click();await p.locator('#search-input').fill('魔网');assert.ok(await p.locator('.search-result').count());await p.keyboard.press('Escape');
  await p.emulateMedia({media:'print'});assert.equal(await p.locator('.goddess:visible').count(),0);assert.equal(await p.locator('.reader-scrollbar:visible').count(),0);assert.equal(await p.locator('.chapter:visible').count(),9);await p.emulateMedia({media:'screen'});
  const narrow=await b.newPage({viewport:{width:390,height:844}}),portraitRequests=[];narrow.on('request',r=>{if(r.url().includes('/companion-'))portraitRequests.push(r.url())});await narrow.goto(base+'/dnd/');assert.deepEqual(portraitRequests,[]);await narrow.close();
  const blocked=await b.newPage();blocked.on('pageerror',e=>errors.push(e.message));await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')}});await blocked.goto(base+'/dnd/#atlas');await blocked.locator('#layout-select').selectOption('original');await blocked.locator('#theme-button').click();await blocked.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={passed:true,origin:base,sizes:results,navigation:true,fixedFigures:true,scrollbarDrag:true,originalPalettes:true,appearancePersistence:true,readingStatePreserved:true,noMobilePortraitDownload:true,print:true,errors,failed};
  fs.writeFileSync(__dirname+'/stage-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
