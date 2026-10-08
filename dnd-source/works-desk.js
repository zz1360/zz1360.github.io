(() => {
 DndReadingBackup.currentCore=()=>readingState;
 const read=()=>DndReadingBackup.work(DndReadingBackup.read(DndReadingBackup.workKey));
 function refresh(){const s=read(),on=s.book;
  document.querySelectorAll('[data-save-work]').forEach(b=>{b.setAttribute('aria-pressed',on);b.textContent=on?'★ 已收藏作品':'☆ 收藏作品'});
  const note=s.mode==='full'?'允许完整剧透':s.mode==='progress'?'已读完第 '+s.volume+' 卷':'无剧透介绍';
  document.querySelectorAll('[data-work-reading]').forEach(n=>n.textContent=note+(s.last?' · 有可继续的阅读位置':''));
  const shelf=document.getElementById('work-reading-desk');shelf.innerHTML=s.book||s.last?`<h4>我的作品</h4><a class="desk-item" href="https://blog.luckydogs.top/dnd/works/yinhun/#reading"><strong>《阴魂》${s.book?' · 已收藏':''} ↗</strong><span>${note}${s.last?' · 打开后可继续阅读':''}</span></a>`:'';
 }
 document.querySelectorAll('[data-save-work]').forEach(b=>b.onclick=()=>{const s=read();s.book=!s.book;try{localStorage.setItem(DndReadingBackup.workKey,JSON.stringify(s));refresh()}catch{document.querySelector('[data-work-reading]').textContent='浏览器无法保存作品收藏，请检查本地存储权限。'}});
 window.addEventListener('storage',e=>{if([DndReadingBackup.workKey,DndReadingBackup.coreKey].includes(e.key)){refresh();if(e.key===DndReadingBackup.coreKey){readingState=DndReadingBackup.core(DndReadingBackup.read(DndReadingBackup.coreKey));renderReading()}}});
 window.addEventListener('dnd-reading-imported',()=>{readingState=DndReadingBackup.core(DndReadingBackup.read(DndReadingBackup.coreKey));renderReading();refresh()});
 refresh();
})();
