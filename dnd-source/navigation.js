/* Preserve the thread of reading without changing bookmarks or backup data. */
(() => {
 'use strict';
 window.createCodexNavigation=function(o){
  const sections=new Map(),entries=new Map(),art=new Map(),ignored=new WeakSet();
  const key='dnd-codex-navigation-v1'+(DATA.setting?.id&&DATA.setting.id!=='realms'?'-'+DATA.setting.id:''),stateKey='codexReader',trailKey='codexTrail';
  let pendingSource=null,restoring=false,restoreToken=0;
  const position=n=>Number.isFinite(n)?Math.max(0,Math.min(1000000,n)):0;
  try{const saved=JSON.parse(sessionStorage.getItem(key)||'{}');for(const [name,map,valid] of [['sections',sections,id=>o.sectionNames[id]],['entries',entries,id=>o.byId[id]],['art',art,id=>o.byId[id.split('/')[0]]]])for(const [id,top] of Object.entries(saved[name]||{}))if(valid(id)&&Number.isFinite(top))map.set(id,position(top))}catch{}
  const readerTop=()=>document.body.classList.contains('stage-mode')?o.reader.scrollTop:window.scrollY;
  const scrollReader=top=>(document.body.classList.contains('stage-mode')?o.reader:window).scrollTo({top:position(top),behavior:'instant'});
  const state=()=>history.state&&typeof history.state==='object'?history.state:{};
  const trail=()=>Array.isArray(state()[trailKey])?state()[trailKey].slice(-20):[];
  function persist(){try{sessionStorage.setItem(key,JSON.stringify({sections:Object.fromEntries(sections),entries:Object.fromEntries(entries),art:Object.fromEntries(art)}))}catch{}}
  function snapshot(){
   const section=o.getSection(),ctx={hash:location.hash,section,readerTop:readerTop(),mode:'section',id:null,variant:0,surfaceTop:0};
   sections.set(section,ctx.readerTop);
   if(o.searchDialog.open){ctx.mode='search';ctx.search=o.search().snapshot()}
   else if(o.artDialog.open){ctx.mode='art';ctx.id=o.getArt();ctx.variant=o.getVariant();ctx.surfaceTop=o.artDialog.scrollTop;art.set(ctx.id+'/'+ctx.variant,ctx.surfaceTop)}
   else if(o.entryDialog.open){ctx.mode='entry';ctx.id=o.entryDialog.dataset.entry;ctx.surfaceTop=o.entryDialog.scrollTop;entries.set(ctx.id,ctx.surfaceTop)}
   persist();return ctx;
  }
  function capture(){if(restoring)return;const ctx=pendingSource||snapshot();history.replaceState({...state(),[stateKey]:ctx},'',location.href);return ctx}
  function navigate(hash){
   if(location.hash===hash&&!pendingSource)return;
   const ctx=capture()||snapshot(),path=trail();pendingSource=null;
   history.pushState({[trailKey]:[...path,ctx].slice(-20)},'',hash);
  }
  function suppressClose(dialog){if(dialog.open)ignored.add(dialog)}
  function consumeClose(dialog){if(!ignored.has(dialog))return false;ignored.delete(dialog);return true}
  function close(dialog){if(dialog.open){suppressClose(dialog);dialog.close()}}
  function rememberSection(id){if(!restoring&&o.sectionNames[id]){sections.set(id,readerTop());persist()}}
  function restoreSection(id,top=sections.get(id)||0){const token=++restoreToken;requestAnimationFrame(()=>{if(token===restoreToken)scrollReader(top)})}
  function surfaceOpened(mode,id,variant=0){
   const node=mode==='entry'?o.entryDialog:o.artDialog,map=mode==='entry'?entries:art,slot=mode==='entry'?id:id+'/'+variant;
   const top=map.get(slot)||0;node.scrollTop=top;
   requestAnimationFrame(()=>{if(node.open&&(mode==='entry'?node.dataset.entry===id:o.getArt()===id&&o.getVariant()===variant))node.scrollTop=top});
  }
  function restoreRoute(){
   const ctx=state()[stateKey];
   if(!ctx||ctx.hash!==location.hash){restoreSection(o.getSection());return}
   restoring=true;const token=++restoreToken;
   requestAnimationFrame(()=>{
    if(token!==restoreToken){restoring=false;return}
    scrollReader(sections.get(ctx.section)??ctx.readerTop);
    if(ctx.mode==='entry'&&o.entryDialog.open&&o.entryDialog.dataset.entry===ctx.id)o.entryDialog.scrollTop=position(entries.get(ctx.id)??ctx.surfaceTop);
    if(ctx.mode==='art'&&o.artDialog.open&&o.getArt()===ctx.id)o.artDialog.scrollTop=position(art.get(ctx.id+'/'+ctx.variant)??ctx.surfaceTop);
    if(ctx.mode==='search'){
     o.search().restore(ctx.search||{});if(!o.searchDialog.open)o.searchDialog.showModal();o.searchInput.focus({preventScroll:true});
    }
    restoring=false;
   });
  }
  function markup(id){
   const section=o.byId[id]?.section,originSection=section==='worlds'?'cosmos':section,previous=trail().at(-1),name=previous?.mode==='search'?'搜索结果':previous?.id&&o.byId[previous.id]?o.byId[previous.id].name:o.sectionNames[originSection]||'阅览目录';
   return `<div class="reading-trail" role="navigation" aria-label="阅读路径"><button type="button" class="plain" data-reading-back>← 返回${o.esc(name)}</button><span>${o.esc(o.sectionNames[o.byId[id]?.section]||'知识档案')}</span></div>`;
  }
  function back(){
   capture();if(trail().length){history.back();return}
   const section=o.getSection();close(o.entryDialog);close(o.artDialog);history.replaceState({},'','#'+section);o.apply();restoreSection(section);
  }
  function closedToSection(){
   const section=o.getSection();history.replaceState({},'','#'+section);document.title=siteTitle;restoreSection(section);
  }
  function closedArt(){
   const id=o.entryDialog.dataset.entry;
   if(o.entryDialog.open&&o.byId[id]){
    const path=trail();if(path.at(-1)?.mode==='entry'&&path.at(-1)?.id===id){history.back();return}
    history.replaceState({[trailKey]:path},'','#entry/'+id);document.title=o.byId[id].name+' · '+siteTitle;
   }else closedToSection();
  }
  document.addEventListener('click',e=>{
   const link=e.target.closest('a[href^="#"]');
   if(link&&o.sectionNames[link.hash.slice(1)]&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&!e.altKey)capture();
  },true);
  document.addEventListener('click',e=>{if(e.target.closest('[data-reading-back]'))back()});
  const rememberSurface=()=>{if(restoring)return;if(o.entryDialog.open)entries.set(o.entryDialog.dataset.entry,position(o.entryDialog.scrollTop));if(o.artDialog.open)art.set(o.getArt()+'/'+o.getVariant(),position(o.artDialog.scrollTop))};
  o.entryDialog.addEventListener('scroll',rememberSurface,{passive:true});o.artDialog.addEventListener('scroll',rememberSurface,{passive:true});
  window.addEventListener('pagehide',capture);
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  return {capture,navigate,rememberSection,restoreSection,surfaceOpened,restoreRoute,markup,suppressClose,consumeClose,close,closedToSection,closedArt,
   fromSearch(){pendingSource=snapshot();capture()},
   fromSurface(){pendingSource=snapshot();capture()},
   initialize(){restoreRoute()},
   get restoring(){return restoring}};
 };
})();
