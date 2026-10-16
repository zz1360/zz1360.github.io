const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.SITE_ORIGIN||'http://127.0.0.1:8916',out=__dirname;
(async()=>{
 const b=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],screens=[];
 try{
  const p=await b.newPage({reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failed.push(r.url())});
  await p.addInitScript(()=>{const key='dnd-codex-reading-v1',get=Storage.prototype.getItem,set=Storage.prototype.setItem;set.call(localStorage,key,'{"saved":["mystra"],"recent":[]}');window.deskStorageCalls=[];Storage.prototype.getItem=function(k){if(k===key)window.deskStorageCalls.push('get');return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k===key)window.deskStorageCalls.push('set');return set.call(this,k,v)}});
  for(const [width,height]of [[2048,1280],[1440,900],[1280,800],[390,844],[320,760]]){
   await p.setViewportSize({width,height});await p.goto(origin+'/dnd/#overview');await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(()=>window.CODEX_VIEWS?.length===2&&document.querySelector('#home-viz .node-label')?.style.left);
   assert.equal(await p.locator('#overview .hero,.reading-desk,#work-reading-desk,[data-save],[data-save-work],[data-reader-export]').count(),0);
   assert.equal(await p.locator('#overview .viz').count(),1);assert.equal(await p.locator('#home-viz .node-label').count(),11);
   const header=p.locator(width>1100?'.chamber-edition':'.setting-toolbar');assert.ok(await header.isVisible());assert.ok((await header.innerText()).includes('5E'));assert.ok((await header.locator('option:checked').textContent()).includes('被遗忘的国度'));
   for(const light of [false,true]){
    if(await p.locator('body').evaluate(n=>n.classList.contains('light'))!==light)await p.locator('#theme-button').click();
    const fit=await p.evaluate(()=>{const v=document.querySelector('#home-viz').getBoundingClientRect(),labels=[...document.querySelectorAll('#home-viz .node-label')].map(n=>n.getBoundingClientRect());return {page:document.documentElement.scrollWidth<=innerWidth+1,inside:labels.every(r=>r.left>=v.left+8&&r.right<=v.right-8&&r.top>=v.top+90&&r.bottom<=v.bottom-70),overlap:labels.some((a,i)=>labels.slice(i+1).some(b=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top))}});
    if(fit.overlap)console.log(await p.locator("#home-viz .node-label").evaluateAll(ns=>ns.map(n=>({text:n.textContent,rect:n.getBoundingClientRect().toJSON()}))));assert.ok(fit.page&&fit.inside&&!fit.overlap,JSON.stringify({width,light,fit}));
    if(width===2048||width===390){const name=`overview-${width}-${light?'light':'dark'}.png`;await p.screenshot({path:out+'/'+name,fullPage:width<1100});screens.push(name)}
   }
   assert.equal(await p.locator('#home-viz .pause-viz').isDisabled(),true);
  }
  await p.setViewportSize({width:1440,height:900});await p.goto(origin+'/dnd/#overview');await p.locator('#home-viz .node-label[data-plane="material"]').click();assert.equal(await p.locator('#entry-dialog').isVisible(),true);assert.equal(await p.locator('#entry-dialog [data-save]').count(),0);assert.equal(await p.locator('#entry-dialog [data-share]').count(),1);await p.locator('[data-reading-back]').click();await p.waitForFunction(()=>location.hash==='#overview'&&!document.getElementById('entry-dialog').open);
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>!document.querySelector('#home-viz .pause-viz').disabled);
  const a=await p.evaluate(()=>({node:CODEX_VIEWS[0].group.rotation.y,ornament:CODEX_VIEWS[0].ornament.rotation.z}));await p.waitForFunction(value=>CODEX_VIEWS[0].ornament.rotation.z>value,a.ornament);const z=await p.evaluate(()=>({node:CODEX_VIEWS[0].group.rotation.y,ornament:CODEX_VIEWS[0].ornament.rotation.z}));assert.equal(a.node,z.node);assert.notEqual(a.ornament,z.ornament);
  await p.locator('#home-viz .pause-viz').click();await p.waitForTimeout(60);const paused=await p.evaluate(()=>CODEX_VIEWS[0].ornament.rotation.z);await p.waitForTimeout(160);assert.equal(await p.evaluate(()=>CODEX_VIEWS[0].ornament.rotation.z),paused);
  await p.locator('#home-viz canvas').focus();await p.keyboard.press('ArrowRight');assert.ok(await p.evaluate(()=>CODEX_VIEWS[0].group.rotation.y>0));await p.locator('#home-viz .reset-viz').click();assert.equal(await p.evaluate(()=>CODEX_VIEWS[0].group.rotation.y),0);
  assert.deepEqual(await p.evaluate(()=>window.deskStorageCalls),[]);
  // Both unavailable WebGL and a lost context keep all eleven entries accessible.
  await p.evaluate(()=>CODEX_VIEWS[0].renderer.domElement.dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
  assert.equal(await p.locator('#home-viz .fallback').isVisible(),true);assert.equal(await p.locator('#home-viz .fallback [data-plane]').count(),11);await p.locator('#home-viz .fallback [data-plane="astral"]').click();assert.equal(await p.locator('#entry-dialog').isVisible(),true);
  const fallback=await b.newPage({viewport:{width:390,height:844}});fallback.on('pageerror',e=>errors.push(e.message));await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(/webgl/i.test(type))return null;return original.call(this,type,...args)}});await fallback.goto(origin+'/dnd/');assert.equal(await fallback.locator('#home-viz .fallback').isVisible(),true);await fallback.locator('#home-viz .fallback [data-plane="abyss"]').click();assert.equal(await fallback.locator('#entry-dialog').isVisible(),true);await fallback.close();
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);const report={passed:true,origin,edition:true,cleanOverview:true,removedDesk:true,noDeskStorage:true,nodeLayoutSizes:[2048,1440,1280,390,320],themes:['dark','light'],stableNodes:true,pause:true,keyboard:true,reducedMotion:true,webglFallback:true,contextLoss:true,screenshots:screens,errors,failed};fs.writeFileSync(out+'/overview-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
