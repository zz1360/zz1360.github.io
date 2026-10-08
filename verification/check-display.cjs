const { chromium } = require('/Users/zhangzhuang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict'), fs = require('node:fs');
const base = process.env.SITE_ORIGIN || 'http://127.0.0.1:8887';
const sizes = [[1920,1080],[1440,1000],[1024,768],[768,1024],[390,844],[320,760],[844,390]];
(async () => {
 const browser = await chromium.launch({executablePath:'/Users/zhangzhuang/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const errors=[], failed=[], results=[];
 try {
  const p=await browser.newPage({reducedMotion:'reduce'});
  p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)failed.push(r.url())});
  const fits=async selector=>{
   const images=p.locator(selector);assert.ok(await images.count(),selector);
   for(const img of await images.all()){
    await img.evaluate(n=>{n.loading='eager';return n.decode()});
    const m=await img.evaluate(n=>{const r=n.getBoundingClientRect(),parent=n.parentElement.getBoundingClientRect(),s=getComputedStyle(n);return{w:r.width,h:r.height,nw:n.naturalWidth,nh:n.naturalHeight,fit:s.objectFit,contained:r.left>=parent.left-1&&r.right<=parent.right+1&&r.top>=parent.top-1&&r.bottom<=parent.bottom+1}});
    assert.ok(m.w>0&&m.h>0&&m.nw>0,selector+JSON.stringify(m));assert.ok(m.contained,selector+JSON.stringify(m));
    // Either the box follows the source ratio, or contain displays the full source.
    assert.ok(m.fit==='contain'||Math.abs(m.w/m.h-m.nw/m.nh)<.012,selector+JSON.stringify(m));
   }
  };
  const noOverflow=async selector=>assert.ok(await p.locator(selector).evaluate(n=>n.scrollWidth<=n.clientWidth+1),selector+' overflow at '+JSON.stringify(p.viewportSize()));
  const closeVisible=async selector=>{const r=await p.locator(selector).boundingBox();assert.ok(r&&r.x>=0&&r.y>=0&&r.x+r.width<=p.viewportSize().width+1&&r.y+r.height<=p.viewportSize().height+1,selector)};
  for(const [width,height] of sizes){
   await p.setViewportSize({width,height});
   for(const route of ['/','/blog/','/explore/dnd/']){await p.goto(base+route);await noOverflow('html')}
   await p.goto(base+'/dnd/');
   const ids=await p.evaluate(()=>[...document.querySelectorAll('.entry-art')].map(n=>n.id.slice(4)));
   for(const section of ['overview','worlds','cosmos','history','people','atlas','primer','sources','works']){await p.evaluate(id=>showSection(id),section);await noOverflow('html')}
   await fits('.work-cover');
   for(const id of ids){await p.evaluate(id=>openEntry(id,false),id);await fits('#entry-dialog .dialog-plate img');await noOverflow('#entry-dialog');await closeVisible('#entry-dialog .close');await p.locator('#entry-dialog').evaluate(n=>n.scrollTop=n.scrollHeight);await closeVisible('#entry-dialog .close');await p.keyboard.press('Escape')}
   await p.evaluate(()=>showSection('atlas'));await fits('#map-preview img');
   await p.evaluate(()=>openEntry('mystra',false));if(width===1440||width===390)await p.screenshot({path:__dirname+'/display-dnd-'+width+'.png'});await p.keyboard.press('Escape');
   await p.goto(base+'/dnd/#art/laeral/2');await fits('#art-dialog .art-stage img');await noOverflow('#art-dialog');await closeVisible('#art-dialog .close');await p.keyboard.press('Escape');
   await p.goto(base+'/dnd/works/yinhun/');await p.waitForSelector('html.reader-ready');await fits('.hero-art img');await noOverflow('html');
   if(width===1440||width===390)await p.screenshot({path:__dirname+'/display-yinhun-'+width+'.png'});
   await p.locator('#reader-mode').selectOption('full');await noOverflow('html');await fits('.portrait-frame img');
   for(const card of await p.locator('.cast-card').all()){
    await card.click();await fits('#dialog-content .detail-art img');await noOverflow('#detail-dialog');await closeVisible('.close-dialog');await p.locator('.dialog-shell').evaluate(n=>n.scrollTop=n.scrollHeight);await closeVisible('.close-dialog');await p.keyboard.press('Escape');
   }
   console.log(`Verified ${width} × ${height}`);
   results.push({width,height,dndArchives:ids.length,yinhunCharacters:12});
  }
  assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
  const report={passed:true,origin:base,sizes:results,fullIllustrations:true,dialogBounds:true,jsErrors:errors,failedResources:failed};
  fs.writeFileSync(__dirname+'/display-check.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
