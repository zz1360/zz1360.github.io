const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.SITE_ORIGIN||'http://127.0.0.1:8916';
const profiles=[['realms','/dnd/',71,14],['eberron','/dnd/settings/eberron/',41,4],['planescape','/dnd/settings/planescape/',54,5]];
(async()=>{
 const browser=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checks=[],screens=[];
 const p=await browser.newPage({reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failed.push(r.url())});
 async function chapter(id){await p.evaluate(id=>{location.hash=id},id);await p.waitForFunction(id=>document.querySelector('.chapter:not([hidden])')?.id===id,id)}
 async function close(){await p.locator('#entry-dialog [data-close="entry-dialog"]').click();await p.waitForFunction(()=>!document.getElementById('entry-dialog').open&&!window.codexNavigation.restoring)}
 try{
  for(const [setting,path,total,local] of profiles){
   await p.setViewportSize({width:1920,height:1080});await p.goto(origin+path+'#people');await p.waitForFunction(()=>window.codexNavigation&&!window.codexNavigation.restoring);await p.evaluate(()=>document.fonts.ready);
   assert.equal(await p.locator('#person-world').count(),0);assert.equal(await p.locator('[data-setting-select]:visible').count(),1);
   assert.equal(await p.locator('#people-grid [data-entry]:visible').count(),local);
   const content=await p.evaluate(()=>({total:ALL.length,incomplete:ALL.filter(x=>x.details.length<2||x.details.some(([h,t])=>!h||!t)).map(x=>x.id),badSources:ALL.filter(x=>x.src.some(k=>!DATA.sources[k])).map(x=>x.id),filler:[...document.querySelectorAll('.chapter:not(#sources)>.section-head .sub')].length}));
   assert.equal(content.total,total);assert.deepEqual(content.incomplete,[]);assert.deepEqual(content.badSources,[]);assert.equal(content.filler,0);
   // Search is setting-local, applies with category chips, and exposes a useful empty state.
   const first=await p.evaluate(()=>DATA.people[0]);await p.locator('#person-query').fill(first.en);assert.equal(await p.locator('#people-grid [data-entry]:visible').count(),1);await p.locator('[data-person-role="'+first.role+'"]').click();assert.equal(await p.locator('#people-grid [data-entry]:visible').count(),1);
   await p.locator('#person-query').fill('zz-no-such-character-987');assert.equal(await p.locator('#people-empty').isVisible(),true);await p.locator('#reset-people').click();assert.equal(await p.locator('#people-grid [data-entry]:visible').count(),local);
   if(setting==='realms'){
    assert.equal(await p.locator('#people-crossworld').getAttribute('open'),null);assert.equal(await p.locator('#crossworld-grid [data-entry]').count(),8);
    await p.locator('#person-query').fill('Tasha');assert.equal(await p.locator('#people-crossworld').getAttribute('open'),'');assert.equal(await p.locator('#crossworld-grid [data-entry]:visible').count(),1);await p.locator('#reset-people').click();assert.equal(await p.locator('#people-crossworld').getAttribute('open'),null);
    await p.goto(origin+path+'#entry/crown-wars');const text=await p.locator('#entry-content').innerText();for(const term of ['阿瑞凡达','米耶里塔','黑暗灾难','卓尔'])assert.ok(text.includes(term));assert.ok(!text.includes('具体战争过程须'));assert.equal(await p.locator('.history-chain-grid').count(),1);assert.equal(await p.locator('#entry-content h4').filter({hasText:'谁先争夺谁的土地'}).count(),0);await close();
    await chapter('history');const c=p.locator('#timeline [data-entry="crown-wars"]');assert.ok((await c.innerText()).includes('米耶里塔'));assert.equal(await c.locator('[data-open]').count(),1);await c.locator('[data-open]').click();assert.ok((await p.locator('#entry-content').innerText()).includes('米耶里塔'));await close();
    await p.goto('about:blank');await p.goto(origin+path+'#entry/ethereal');await p.waitForFunction(()=>document.getElementById('entry-dialog').open&&document.getElementById('entry-dialog').dataset.entry==='ethereal');assert.ok((await p.locator('#entry-content').innerText()).includes('灰色雾层'));await close();
   }
   await chapter('people');await p.locator('#main').evaluate(n=>n.scrollTop=0);await p.screenshot({path:__dirname+`/refined-people-${setting}.png`});screens.push(`refined-people-${setting}.png`);
   for(const [w,h] of [[1920,1080],[1440,900],[1024,768],[390,844],[320,760]]){
    await p.setViewportSize({width:w,height:h});
    for(const section of ['people','history','cosmos','atlas','primer']){
     await chapter(section);assert.ok(await p.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1),`${setting}/${section}/${w} body overflow`);assert.ok(await p.locator('#main').evaluate(n=>n.scrollWidth<=n.clientWidth+1),`${setting}/${section}/${w} panel overflow`);
    }
   }
   checks.push({setting,expandedEntries:total,localPeople:local,duplicateSelectorRemoved:true,filters:true});
  }
  await p.goto(origin+'/dnd/#atlas');
  for(const [w,h] of [[1920,1080],[1440,900],[1024,768],[390,844],[320,760]]){
   await p.setViewportSize({width:w,height:h});
   for(const light of [false,true]){
    if(await p.locator('body').evaluate(n=>n.classList.contains('light'))!==light)await p.locator('#theme-button').click();
    assert.equal(await p.locator('.faerun-map .faerun-pin').count(),15);
    for(const id of ['icewind','neverwinter','phandalin','waterdeep','baldurs','candlekeep','underdark','menzo','chult','thay','great-glacier']){
     const button=p.locator(`.faerun-index [data-map="${id}"]`);await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');assert.ok(await p.locator('#map-preview h4').innerText());
    }
    await p.locator('.faerun-index [data-map="waterdeep"]').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#map-preview h4').innerText(),'深水城');
    assert.ok(await p.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1));
   }
  }
  // Deep links into the collapsed guests and their existing image galleries remain intact.
  await p.goto(origin+'/dnd/#art/tasha/2');assert.equal(await p.locator('#art-counter').innerText(),'3 / 4');await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#art-counter').innerText(),'4 / 4');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={passed:true,origin,checks,totalExpandedEntries:166,viewportWidths:[1920,1440,1024,390,320],themes:['dark','light'],mapLandmarks:15,mapKeyboard:true,mapHorizontalScroll:true,historyNoDuplicateBody:true,galleryPreserved:true,errors,failed,screenshots:screens};fs.writeFileSync(__dirname+'/'+(process.env.CONTENT_REPORT||'content-refinement-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
