const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.SITE_ORIGIN||'http://127.0.0.1:8916';
const profiles=[
 {id:'realms',path:'/dnd/',name:'被遗忘的国度',nodes:['toril','faerun','sword-coast']},
 {id:'eberron',path:'/dnd/settings/eberron/',name:'艾伯伦',nodes:['eberron-world','khorvaire','sharn','siberys','khyber']},
 {id:'planescape',path:'/dnd/settings/planescape/',name:'异度风景',nodes:['sigil-city','outlands','gate-towns','great-wheel']}
];
const sizes=[[2048,1280],[1440,900],[1280,800],[1024,768],[390,844],[320,760],[844,390]];
(async()=>{
 const b=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],screens=[],watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failed.push(r.url())})};
 const ready=async(p,id)=>{await p.waitForFunction(id=>document.querySelector('[data-setting-overview]')?.dataset.settingOverview===id&&!document.getElementById('worlds').hidden,id);await p.evaluate(()=>document.fonts.ready);await p.locator('#worlds .setting-scene').evaluate(n=>n.decode())};
 try{
  const p=await b.newPage({reducedMotion:'reduce'});watch(p);
  for(const profile of profiles){
   for(const [width,height] of sizes){
    await p.setViewportSize({width,height});await p.goto(origin+profile.path+'#worlds');await ready(p,profile.id);
    assert.equal(await p.locator('#world-filters,#world-grid,#world-count,#worlds .definition-row,#worlds .card').count(),0);
    assert.ok((await p.locator('.topbar .nav [data-section="worlds"]').innerText()).endsWith('设定概览'));
    assert.equal(await p.locator('#worlds .setting-heading h2').innerText(),profile.name);
    assert.deepEqual(await p.locator('[data-setting-node]').evaluateAll(ns=>ns.map(n=>n.dataset.settingNode)),profile.nodes);
    assert.equal(await p.locator('.setting-topics li').count(),3);assert.equal(await p.locator('#setting-note-panel').isVisible(),false);
    const visible=await p.locator('#worlds').innerText();for(const word of ['全部设定','灰鹰','龙枪','浩劫残阳'])assert.ok(!visible.includes(word));
    for(const light of [false,true]){
     if(await p.locator('body').evaluate(n=>n.classList.contains('light'))!==light)await p.locator('#theme-button').click();
     const fit=await p.evaluate(()=>{const v=document.querySelector('.setting-board').getBoundingClientRect(),nodes=[...document.querySelectorAll('[data-setting-node]')].map(n=>n.getBoundingClientRect());return {page:document.documentElement.scrollWidth<=innerWidth+1,main:document.getElementById('main').scrollWidth<=document.getElementById('main').clientWidth+1,inside:nodes.every(n=>n.left>=v.left+3&&n.right<=v.right-3&&n.top>=v.top+3&&n.bottom<=v.bottom-3),touch:nodes.every(n=>n.width>=44&&n.height>=44),overlap:nodes.some((a,i)=>nodes.slice(i+1).some(z=>a.left<z.right&&a.right>z.left&&a.top<z.bottom&&a.bottom>z.top))}});
     assert.ok(fit.page&&fit.main&&fit.inside&&fit.touch&&!fit.overlap,JSON.stringify({id:profile.id,width,light,fit}));
     if(width===2048||width===390){const file=`setting-overview-${profile.id}-${width}-${light?'light':'dark'}.png`;await p.screenshot({path:__dirname+'/'+file,fullPage:width<=1100});screens.push(file)}
    }
   }
   await p.setViewportSize({width:1440,height:900});await p.goto(origin+profile.path+'#worlds');await ready(p,profile.id);
   // All node notes have real sources and a valid setting-local destination.
   for(const id of profile.nodes){
    const node=p.locator(`[data-setting-node="${id}"]`);await node.click();assert.equal(await node.getAttribute('aria-expanded'),'true');assert.ok(await p.locator('#setting-note-panel').isVisible());assert.ok((await p.locator('#setting-note-body>p').innerText()).length>12);
    await p.locator('#setting-note-body .setting-note-sources summary').click();assert.ok(await p.locator('#setting-note-body .setting-note-sources a:visible').count());
    const action=p.locator('#setting-note-body .setting-note-actions>.plain'),entry=await action.getAttribute('data-open');
    if(entry){await action.click();assert.equal(await p.locator('#entry-dialog').getAttribute('data-entry'),entry);await p.locator('#entry-dialog [data-reading-back]').click();await p.waitForFunction(()=>location.hash==='#worlds'&&!document.getElementById('entry-dialog').open)}
    else{const hash=await action.getAttribute('href');await action.click();await p.waitForURL(origin+profile.path+hash);await p.goBack();await p.waitForURL(origin+profile.path+'#worlds')}
    assert.equal(await node.getAttribute('aria-expanded'),'true');await p.locator('.setting-note-close').click();assert.equal(await p.locator('#setting-note-panel').isVisible(),false);assert.equal(await node.evaluate(n=>n===document.activeElement),true);
   }
   // Keyboard expansion and Escape leave the node at its original coordinates.
   const node=p.locator('[data-setting-node]').first();await node.focus();const before=await node.boundingBox();await p.keyboard.press('Enter');assert.equal(await p.locator('#setting-note-panel').isVisible(),true);await p.keyboard.press('Escape');assert.equal(await p.locator('#setting-note-panel').isVisible(),false);assert.equal(await node.evaluate(n=>n===document.activeElement),true);const after=await node.boundingBox();assert.ok(Math.abs(before.x-after.x)<1);
   await p.locator('.setting-scene-launch').click();await p.locator('#setting-scene-dialog img').evaluate(n=>n.decode());assert.ok(await p.locator('#setting-scene-dialog').isVisible());assert.equal(await p.locator('#setting-scene-dialog img').evaluate(n=>getComputedStyle(n).objectFit),'contain');assert.equal(await p.locator('#setting-scene-dialog img').evaluate(n=>n.naturalWidth),1536);await p.keyboard.press('Escape');assert.equal(await p.locator('#setting-scene-dialog').isVisible(),false);assert.equal(await p.locator('.setting-scene-launch').evaluate(n=>n===document.activeElement),true);
   await p.locator('#layout-select').selectOption('original');assert.ok(await p.locator('.setting-toolbar').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.locator('#layout-select').selectOption('companions');
   await p.emulateMedia({media:'print'});assert.equal(await p.locator('#worlds').isVisible(),true);assert.equal(await p.locator('#worlds .setting-node:visible').count(),profile.nodes.length);assert.equal(await p.locator('#setting-scene-dialog').isVisible(),false);await p.emulateMedia({media:'screen'});
  }
  await p.goto(origin+'/dnd/#worlds');await p.locator('[data-setting-select]:visible').selectOption('eberron');await p.waitForURL(origin+profiles[1].path+'#worlds');await ready(p,'eberron');await p.locator('[data-setting-select]:visible').selectOption('planescape');await p.waitForURL(origin+profiles[2].path+'#worlds');await p.goBack();await p.waitForURL(origin+profiles[1].path+'#worlds');
  // Seven old references are addressable but are absent from the current directory and search index.
  await p.goto(origin+'/dnd/#worlds');assert.deepEqual(await p.evaluate(()=>DATA.worlds.map(x=>x.id)),['fr']);assert.equal(await p.evaluate(()=>DATA.reference_worlds.length),7);
  await p.locator('#launch-search').click();await p.locator('#search-input').fill('灰鹰');assert.equal(await p.locator('[data-result="greyhawk"]').count(),0);await p.locator('#search-input').fill('托瑞尔');assert.equal(await p.locator('[data-result]').first().getAttribute('data-result'),'fr');await p.keyboard.press('Escape');
  for(const id of ['greyhawk','krynn','eberron','ravenloft','athas','planescape','spelljammer']){await p.goto(origin+'/dnd/#entry/'+id);assert.equal(await p.locator('#entry-dialog').getAttribute('data-entry'),id);assert.ok((await p.locator('#entry-dialog .reference-notice').innerText()).includes('跨设定参考'))}
  const plain=await b.newPage({javaScriptEnabled:false,viewport:{width:1280,height:900}});watch(plain);await plain.goto(origin+'/dnd/#worlds');assert.equal(await plain.locator('.setting-static-notes>details').count(),3);await plain.locator('.setting-static-notes>details>summary').first().click();assert.ok((await plain.locator('.setting-static-notes>details').first().innerText()).includes('托瑞尔'));await plain.close();
  const blocked=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});watch(blocked);await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new DOMException('blocked','SecurityError')};Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')}});await blocked.goto(origin+profiles[2].path+'#worlds');await blocked.locator('[data-setting-node="sigil-city"]').click();assert.ok((await blocked.locator('#setting-note-body').innerText()).includes('印记城'));await blocked.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);const report={passed:true,origin,settings:profiles.map(x=>({id:x.id,nodes:x.nodes.length})),sizes,themes:['dark','light'],settingOnly:true,noSettingDirectory:true,allNodeActions:true,sourceLinks:true,keyboardAndEscape:true,stableCoordinates:true,uncroppedOriginals:true,settingSwitchKeepsChapter:true,legacyReferencesExcludedFromSearch:true,sevenLegacyDirectLinks:true,originalLayout:true,print:true,noJavaScriptReading:true,blockedStorage:true,screenshots:screens,errors,failed};fs.writeFileSync(__dirname+'/'+(process.env.OVERVIEW_REPORT||'setting-overviews-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
