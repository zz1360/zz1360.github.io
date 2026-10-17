const {chromium}=require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const origin=process.env.SITE_ORIGIN||'http://127.0.0.1:8916';
const paths={realms:'/dnd/',eberron:'/dnd/settings/eberron/',planescape:'/dnd/settings/planescape/'};
const sizes=[[1920,1080],[1440,900],[1024,768],[390,844],[320,760],[844,390]];
(async()=>{
 const b=await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[],failed=[],checked=[],screens=[];
 try{
  const p=await b.newPage({reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)failed.push(r.url())});
  const manifest=await (await p.request.get(origin+'/dnd/manifest.json')).json();
  assert.equal(manifest.archiveArt.newIllustrations,39);assert.equal(manifest.archiveArt.entries.length,73);
  async function imageFits(selector){
   const img=p.locator(selector);
   await img.evaluate(n=>{n.loading='eager';return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
   await p.waitForFunction(selector=>{const n=document.querySelector(selector);return n?.complete&&n.naturalWidth>0},selector);
   await img.evaluate(n=>n.decode()).catch(error=>{throw new Error(selector+': '+error.message)});
   const m=await img.evaluate(n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n),parent=n.parentElement.getBoundingClientRect();return{w:r.width,h:r.height,nw:n.naturalWidth,nh:n.naturalHeight,fit:s.objectFit,contained:r.left>=parent.left-1&&r.right<=parent.right+1,src:n.currentSrc,full:n.dataset.full,aw:Number(n.getAttribute('width')),ah:Number(n.getAttribute('height'))}});
   assert.ok(m.w>0&&m.h>0&&m.nw>0,selector+' '+JSON.stringify(m));assert.ok(m.contained,selector+' bounds');
   assert.ok(m.fit==='contain'||Math.abs(m.w/m.h-m.nw/m.nh)<.015,selector+' cropped');
   if(m.aw&&m.ah)assert.ok(Math.abs(m.aw/m.ah-m.nw/m.nh)<.015,selector+' intrinsic ratio');
   return m;
  }
  async function bounds(dialog){
   assert.ok(await p.locator(dialog).evaluate(n=>n.scrollWidth<=n.clientWidth+1),dialog+' overflows');
   const r=await p.locator(dialog+' .close').boundingBox(),s=p.viewportSize();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=s.width+1&&r.y+r.height<=s.height+1,dialog+' close button');
  }
  for(const [setting,path] of Object.entries(paths)){
   console.log('Checking illustrated archives:',setting);
   const records=manifest.archiveArt.entries.filter(x=>x.setting===setting);
   await p.setViewportSize({width:1440,height:900});await p.goto(origin+path+'#people');
   const expected=manifest.archiveArt.coverage[setting];
   const groups=await p.evaluate(()=>Object.fromEntries(['people','locations','factions'].map(k=>[k,DATA[k].map(x=>x.id)])));
   for(const group of Object.keys(expected))assert.equal(groups[group].length,expected[group]);
   // Every entity card and archive modal has the correct setting-local art.
   for(const record of records){
    const section=record.group==='people'?'people':'atlas';await p.evaluate(id=>showSection(id,false),section);
    const card=p.locator('[data-entry="'+record.id+'"]');assert.equal(await card.count(),1);assert.equal(await card.locator('.setting-sigil').count(),0);
    const im=await imageFits('#art-'+record.id);assert.equal(im.full,record.full);
    const open=card.locator('[data-open="'+record.id+'"]');
    if(await open.count())await open.click();
    else{await card.locator('.card-bottom [data-art]').click();await p.locator('#art-read').click()}
    assert.equal(await p.locator('#entry-dialog').getAttribute('data-entry'),record.id);
    await imageFits('#entry-dialog .dialog-plate img');await bounds('#entry-dialog');
    await p.locator('#entry-dialog .dialog-plate [data-art]').click();assert.equal(await p.locator('#art-title').innerText(),await p.evaluate(id=>BYID[id].name+' · '+BYID[id].en,record.id));
    await imageFits('#art-full');await bounds('#art-dialog');assert.ok(await p.locator('#art-caption').innerText());
    await p.keyboard.press('Escape');
    await p.waitForFunction(id=>location.hash==='#entry/'+id&&document.getElementById('entry-dialog').open&&!document.getElementById('art-dialog').open&&!window.codexNavigation.restoring,record.id);
    await p.locator('#entry-dialog [data-close="entry-dialog"]').click();
    await p.waitForFunction(()=>!document.getElementById('entry-dialog').open&&!document.getElementById('art-dialog').open&&!window.codexNavigation.restoring);
   }
   checked.push({setting,groups:expected,illustrated:records.length});
   // Both themes, six viewport sizes, all three entity groups, and representative modals.
   for(const [width,height] of sizes){
    await p.setViewportSize({width,height});
    for(const light of [false,true]){
     if(await p.locator('body').evaluate(n=>n.classList.contains('light'))!==light)await p.locator('#theme-button').click();
     for(const section of ['people','atlas']){
      await p.evaluate(id=>showSection(id,false),section);
      assert.ok(await p.locator('html').evaluate(n=>n.scrollWidth<=n.clientWidth+1),setting+' document overflow');
      assert.ok(await p.locator('#main').evaluate(n=>n.scrollWidth<=n.clientWidth+1),setting+' panel overflow');
      const ids=records.filter(x=>(x.group==='people'?'people':'atlas')===section).map(x=>x.id);
      for(const id of ids)await imageFits('#art-'+id);
      if((width===1440||width===390)&&section==='people'){
       await p.evaluate(()=>{document.activeElement?.blur();document.getElementById('main').scrollTop=0;window.scrollTo(0,0)});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
       const file=`archive-${setting}-${width}-${light?'light':'dark'}.png`;await p.screenshot({path:__dirname+'/'+file,fullPage:width<1100});screens.push(file);
      }
     }
     const sample=records.find(x=>x.group==='people');await p.evaluate(id=>openEntry(id,false),sample.id);await imageFits('#entry-dialog .dialog-plate img');await bounds('#entry-dialog');await p.keyboard.press('Escape');
    }
   }
  }
  // Deep links, image siblings and the existing four-image gallery still work.
  await p.goto(origin+paths.eberron+'#art/eb-oargev/0');await imageFits('#art-full');await p.keyboard.press('ArrowRight');assert.ok((await p.locator('#art-title').innerText()).includes('至高王庭'));await p.keyboard.press('Escape');
  await p.goto(origin+paths.planescape+'#entry/ps-morte');await imageFits('#entry-dialog .dialog-plate img');await p.reload();await imageFits('#entry-dialog .dialog-plate img');await p.keyboard.press('Escape');
  await p.goto(origin+paths.planescape+'#art/ps-lady/2');assert.equal(await p.locator('#art-counter').innerText(),'3 / 4');await p.keyboard.press('ArrowRight');assert.equal(await p.locator('#art-counter').innerText(),'4 / 4');
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={passed:true,origin,newIllustrations:39,entityArchives:73,settings:checked,sizes,themes:['dark','light'],cards:true,archives:true,fullImageViewers:true,uncropped:true,directLinks:true,existingGalleryPreserved:true,screenshots:screens,errors,failed};
  fs.writeFileSync(__dirname+'/'+(process.env.ARCHIVE_REPORT||'archive-art-check.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
