const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.SITE_ORIGIN||'http://127.0.0.1:8916';
const profiles=[
 {id:'realms',name:'被遗忘的国度',path:'/dnd/',nodes:11,entries:71,center:'material',query:'密斯特拉'},
 {id:'eberron',name:'艾伯伦',path:'/dnd/settings/eberron/',nodes:14,entries:41,center:'eb-material',query:'沙恩'},
 {id:'planescape',name:'异度风景',path:'/dnd/settings/planescape/',nodes:18,entries:54,center:'ps-outlands',query:'印记城'}
];
const sizes=[[2048,1280],[1440,900],[1280,800],[390,844],[320,760]];
(async()=>{
 const b=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],screens=[],counts=[];
 const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failed.push(r.url())})};
 const ready=async(p,id)=>{await p.waitForFunction(id=>document.body.dataset.setting===id&&window.CODEX_VIEWS?.length===2&&(document.querySelector('#overview').hidden||document.querySelector('#home-viz .node-label')?.style.left),id);await p.evaluate(()=>document.fonts.ready)};
 const chapter=async(p,id)=>{await p.evaluate(id=>{location.hash=id},id);await p.waitForFunction(id=>document.querySelector('.chapter:not([hidden])')?.id===id,id)};
 const selector=p=>p.locator('[data-setting-select]:visible');
 try{
  const p=await b.newPage({reducedMotion:'reduce'});watch(p);
  for(const profile of profiles){
   for(const [width,height] of sizes){
    await p.setViewportSize({width,height});await p.goto(origin+profile.path+'#overview');await ready(p,profile.id);
    assert.equal(await selector(p).count(),1);assert.equal(await selector(p).inputValue(),profile.id);
    assert.deepEqual(await selector(p).locator('option').allTextContents(),profiles.map(x=>x.name));
    assert.ok((await p.locator('.setting-controls:visible').innerText()).includes('5E'));
    assert.equal(await p.locator('#home-viz .node-label').count(),profile.nodes);
    assert.equal(await p.locator('#home-viz .pause-viz').isDisabled(),true);
    for(const light of [false,true]){
     if(await p.locator('body').evaluate(n=>n.classList.contains('light'))!==light)await p.locator('#theme-button').click();
     // Native selector and diagram targets must remain legible and inside their own regions.
     const fit=await p.evaluate(()=>{
      const v=document.querySelector('#home-viz').getBoundingClientRect(),labels=[...document.querySelectorAll('#home-viz .node-label')].map(n=>n.getBoundingClientRect()),s=[...document.querySelectorAll('[data-setting-select]')].find(n=>n.offsetWidth).getBoundingClientRect();
      return {page:document.documentElement.scrollWidth<=innerWidth+1,main:document.getElementById('main').scrollWidth<=document.getElementById('main').clientWidth+1,select:s.left>=0&&s.right<=innerWidth,inside:labels.every(r=>r.left>=v.left+8&&r.right<=v.right-8&&r.top>=v.top+90&&r.bottom<=v.bottom-70),overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))};
     });
     assert.ok(fit.page&&fit.main&&fit.select&&fit.inside&&!fit.overlap,JSON.stringify({setting:profile.id,width,light,fit}));
     if(width===2048||width===390){const file=`settings-${profile.id}-${width}-${light?'light':'dark'}.png`;await p.screenshot({path:__dirname+'/'+file,fullPage:width<1100});screens.push(file)}
    }
   }
   await p.setViewportSize({width:1440,height:900});await p.goto(origin+profile.path+'#overview');await ready(p,profile.id);
   const data=await p.evaluate(()=>({setting:DATA.setting,planes:DATA.planes,ids:ALL.map(x=>x.id),groups:Object.fromEntries(['worlds','planes','history','people','locations','factions','terms'].map(k=>[k,DATA[k].length])),dates:DATA.history.map(x=>x.date)}));
   assert.equal(data.ids.length,profile.entries);assert.equal(new Set(data.ids).size,profile.entries);
   assert.deepEqual(await p.locator('#home-viz .node-label').evaluateAll(ns=>ns.map(n=>n.dataset.plane).sort()),data.planes.map(x=>x.id).sort());
   counts.push({setting:profile.id,entries:profile.entries,groups:data.groups,graphNodes:profile.nodes});
   if(profile.id!=='realms'){
    assert.ok(data.ids.every(id=>id.startsWith(profile.id==='eberron'?'eb-':'ps-')));
    assert.ok(data.dates.every(date=>!date.includes('DR')));
    assert.ok((await p.title()).includes(profile.name));
   }
   // Every main chapter renders its own content without stale map/novel placeholders.
   for(const id of ['worlds','cosmos','history','people','atlas','primer','sources','works']){
    await chapter(p,id);assert.ok((await p.locator('#'+id).innerText()).trim().length>30);
    assert.ok(await p.locator('#main').evaluate(n=>n.scrollWidth<=n.clientWidth+1),profile.id+' '+id+' overflow');
   }
   if(profile.id!=='realms'){
    assert.equal(await p.locator('#map-preview').count(),0);assert.ok(!(await p.locator('#works').innerText()).includes('阴魂'));
    assert.equal(await p.locator('#timeline .time-event').count(),data.groups.history);
    await chapter(p,'history');await p.locator('#history-filters button').nth(1).click();assert.ok(await p.locator('#timeline .time-event:visible').count());assert.ok(await p.locator('#timeline .time-event:visible').count()<data.groups.history);
    await chapter(p,'people');const role=await p.locator('#person-role option').nth(1).getAttribute('value')||await p.locator('#person-role option').nth(1).textContent();await p.locator('#person-role').selectOption(role);assert.ok(await p.locator('#people-grid [data-entry]:visible').count());assert.ok(await p.locator('#people-grid [data-entry]:visible').count()<data.groups.people);await p.locator('#reset-people').click();assert.equal(await p.locator('#people-grid [data-entry]:visible').count(),data.groups.people);
   }
   await chapter(p,'cosmos');
   for(const plane of data.planes){await p.locator(`.plane-selector [data-plane="${plane.id}"]`).click();assert.equal(await p.locator('#plane-panel h3').innerText(),plane.name)}
   await chapter(p,'overview');await p.locator(`#home-viz .node-label[data-plane="${profile.center}"]`).click();assert.equal(await p.locator('#entry-dialog').getAttribute('data-entry'),profile.center);await p.locator('#entry-dialog [data-reading-back]').click();await p.waitForFunction(()=>location.hash==='#overview'&&!document.getElementById('entry-dialog').open);
   await p.locator('#launch-search').click();await p.locator('#search-input').fill(profile.query);assert.ok(await p.locator('.search-result').count());
   if(profile.id!=='realms'){
    await p.locator('[data-search-filter="places"]').click();assert.ok(await p.locator('.search-result').count());
    await p.locator('[data-search-filter="all"]').click();await p.locator('#search-input').fill('密斯特拉');assert.equal(await p.locator('.search-result').count(),0);
    await p.locator('#search-input').fill(profile.id==='eberron'?'印记城':'沙恩');assert.equal(await p.locator('.search-result').count(),0);
    await p.locator('#search-input').fill(profile.id==='eberron'?'Forgotten Relics':'Turn of Fortune');await p.locator('[data-search-filter="works"]').click();assert.ok(await p.locator('.work-result').count());assert.ok((await p.locator('.work-result').first().getAttribute('href')).startsWith('https://www.dndbeyond.com/'));
   }
   await p.keyboard.press('Escape');
   // Direct URLs and share links retain the setting path and restore the right archive.
   await p.goto(origin+profile.path+'#entry/'+profile.center);assert.equal(await p.locator('#entry-dialog').getAttribute('data-entry'),profile.center);
   await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.settingCopiedLink=value}},configurable:true}));await p.locator('#entry-dialog [data-share]').click();await p.waitForFunction(()=>window.settingCopiedLink);assert.equal(await p.evaluate(()=>new URL(window.settingCopiedLink).pathname),profile.path);
   await p.reload();assert.equal(await p.locator('#entry-dialog').getAttribute('data-entry'),profile.center);await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.getElementById('entry-dialog').open);if(profile.id!=='realms')assert.ok((await p.title()).includes(profile.name));
   // The unavailable-graphics path has exactly the same setting-local plane entries.
   await chapter(p,'overview');await p.evaluate(()=>CODEX_VIEWS[0].renderer.domElement.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));assert.equal(await p.locator('#home-viz .fallback').isVisible(),true);assert.equal(await p.locator('#home-viz .fallback [data-plane]').count(),profile.nodes);
   await p.locator(`#home-viz .fallback [data-plane="${profile.center}"]`).click();assert.equal(await p.locator('#entry-dialog').isVisible(),true);await p.keyboard.press('Escape');
   await p.emulateMedia({media:'print'});assert.equal(await p.locator('.goddess:visible').count(),0);assert.equal(await p.locator('.setting-controls:visible').count(),0);assert.equal(await p.locator('.chapter:visible').count(),8);await p.emulateMedia({media:'screen'});
  }
  // New settings do not inherit the old setting's saved section positions.
  await p.goto(origin+'/dnd/#atlas');await p.locator('#main').evaluate(n=>n.scrollTop=280);await p.evaluate(()=>sessionStorage.setItem('dnd-codex-navigation-v1-eberron',JSON.stringify({sections:{atlas:72}})));await selector(p).selectOption('eberron');await p.waitForURL(origin+profiles[1].path+'#atlas');await ready(p,'eberron');await p.waitForFunction(()=>Math.abs(document.getElementById('main').scrollTop-72)<2);
  await selector(p).selectOption('planescape');await p.waitForURL(origin+profiles[2].path+'#atlas');await ready(p,'planescape');await p.goBack();await p.waitForURL(origin+profiles[1].path+'#atlas');await p.goForward();await p.waitForURL(origin+profiles[2].path+'#atlas');
  // Gallery identity remains the Lady of Pain, with all four original illustrations.
  await p.goto(origin+profiles[2].path+'#art/ps-lady/2');assert.equal(await p.locator('#art-counter').innerText(),'3 / 4');await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#art-counter').innerText(),'4 / 4');await p.keyboard.press('Escape');
  // Original layout uses the same selector, and browser preferences do not change a shared setting URL.
  await p.locator('#layout-select').selectOption('original');assert.equal(await p.locator('.setting-toolbar').isVisible(),true);await selector(p).selectOption('eberron');await p.waitForURL(origin+profiles[1].path+'#people');assert.equal(await p.locator('#layout-select').inputValue(),'original');await p.locator('#layout-select').selectOption('companions');
  const mobile=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});watch(mobile);await mobile.goto(origin+'/dnd/');await mobile.locator('#mobile-menu').click();await mobile.locator('.mobile-toc-list a[data-section="history"]').click();await selector(mobile).selectOption('planescape');await mobile.waitForURL(origin+profiles[2].path+'#history');assert.equal(await mobile.locator('#mobile-current-chapter').innerText(),'历史与事件');await mobile.close();
  const blocked=await b.newPage({viewport:{width:390,height:844}});watch(blocked);await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:get.call(this,type,...args)}});await blocked.goto(origin+profiles[1].path);assert.equal(await blocked.locator('#home-viz .fallback [data-plane]').count(),14);await selector(blocked).selectOption('planescape');await blocked.waitForURL(origin+profiles[2].path+'#overview');assert.equal(await blocked.locator('#home-viz .fallback [data-plane]').count(),18);await blocked.locator('#home-viz .fallback [data-plane="ps-sigil"]').click();assert.equal(await blocked.locator('#entry-dialog').getAttribute('data-entry'),'ps-sigil');await blocked.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={passed:true,origin,settings:counts,sizes,themes:['dark','light'],edition:'5E',nativeSelector:true,scopedChapters:true,scopedSearch:true,categoryPreserved:true,settingLocalSessionPositions:true,directLinks:true,backForward:true,galleryPreserved:true,originalLayout:true,mobileDirectory:true,print:true,reducedMotion:true,webglFallback:true,storageBlocked:true,screenshots:screens,errors,failed};fs.writeFileSync(__dirname+'/'+(process.env.SETTINGS_REPORT||'settings-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
