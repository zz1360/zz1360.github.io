(()=>{
 'use strict';
 const narrow=matchMedia('(max-width:1100px)'),button=document.getElementById('mobile-menu'),dialog=document.getElementById('mobile-menu-dialog'),reader=document.getElementById('main'),chapter=document.getElementById('mobile-current-chapter'),current=document.getElementById('mobile-menu-current');
 let followReading=false;
 function syncChapter(){
  const active=document.querySelector('.topbar .nav a[aria-current="page"]'),id=active?.dataset.section||document.querySelector('.chapter:not([hidden])')?.id||'cosmos';
  const label=typeof sectionNames!=='undefined'&&sectionNames[id]?sectionNames[id]:'位面宇宙';
  chapter.textContent=label;current.textContent='当前：'+label;button.setAttribute('aria-label','打开阅览目录，当前章节：'+label);
  dialog.querySelectorAll('[data-section]').forEach(link=>{if(link.dataset.section===id)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')});
 }
 button.addEventListener('click',()=>{
  if(!narrow.matches)return;syncChapter();followReading=false;
  if(!dialog.open)dialog.showModal();button.setAttribute('aria-expanded','true');
  const active=dialog.querySelector('[aria-current="page"]');
  if(active){active.focus({preventScroll:true});const body=dialog.querySelector('.mobile-menu-body');body.scrollTop=Math.max(0,active.offsetTop-body.offsetTop-12)}
 });
 dialog.addEventListener('click',e=>{
  const link=e.target.closest('a[data-section]');
  if(link){followReading=true;dialog.close();return}
  const bounds=dialog.getBoundingClientRect();
  if(e.target===dialog&&(e.clientX<bounds.left||e.clientX>bounds.right||e.clientY<bounds.top||e.clientY>bounds.bottom))dialog.close();
 });
 dialog.addEventListener('close',()=>{
  button.setAttribute('aria-expanded','false');
  if(followReading){followReading=false;requestAnimationFrame(()=>reader.focus({preventScroll:true}))}
 });
 // Keep the original search/gallery shortcuts from opening a second modal.
 // Escape remains native: stop the document handler, allow the cancel event.
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopPropagation()}});
 window.addEventListener('chapterchange',syncChapter);
 window.addEventListener('readerlayoutchange',()=>{
  if(!narrow.matches&&dialog.open){followReading=false;dialog.close();document.querySelector('.topbar .nav a[aria-current="page"]')?.focus({preventScroll:true})}
  if(narrow.matches&&document.activeElement?.closest('.goddess,#layout-select,#companion-picker'))reader.focus({preventScroll:true});
  syncChapter();
 });
 syncChapter();
})();
