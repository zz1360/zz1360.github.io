(()=>{
 'use strict';
 const reader=document.getElementById('main'),track=document.querySelector('.reader-scrollbar'),thumb=track.firstElementChild,cap=document.querySelector('.chamber-cap'),selector=document.getElementById('layout-select'),theme=document.getElementById('theme-button');
 const key='dnd-world-appearance-v1';let drag=null,pending=false;
 function persist(){try{localStorage.setItem(key,JSON.stringify({layout:document.body.classList.contains('stage-mode')?'companions':'original',light:document.body.classList.contains('light')}))}catch{}}
 function update(){
  pending=false;const range=reader.scrollHeight-reader.clientHeight;
  if(!document.body.classList.contains('stage-mode')||range<=0){track.hidden=true;return}
  track.hidden=false;track.style.top=(cap.offsetHeight+8)+'px';
  const h=track.clientHeight,size=Math.min(h,Math.max(34,h*reader.clientHeight/Math.max(reader.scrollHeight,1)));
  thumb.style.height=size+'px';thumb.style.top=((h-size)*reader.scrollTop/range)+'px';track.setAttribute('aria-valuenow',Math.round(100*reader.scrollTop/range));
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
 selector.value=document.body.classList.contains('stage-mode')?'companions':'original';
 function refreshTheme(){const light=document.body.classList.contains('light');theme.textContent=light?'深色':'浅色';theme.setAttribute('aria-label','切换到'+(light?'深色':'浅色')+'阅读模式')}
 refreshTheme();theme.addEventListener('click',()=>{refreshTheme();persist()});
 selector.addEventListener('change',()=>{
  const original=selector.value==='original',offset=document.body.classList.contains('stage-mode')?reader.scrollTop:window.scrollY;
  document.body.classList.toggle('stage-mode',!original);persist();
  requestAnimationFrame(()=>{(original?window:reader).scrollTo({top:offset,behavior:'instant'});schedule()});
 });
 function resetRoute(){if(sectionNames[location.hash.slice(1)]){reader.scrollTop=0;if(!document.body.classList.contains('stage-mode'))window.scrollTo({top:0,behavior:'instant'})}schedule()}
 window.addEventListener('hashchange',resetRoute);window.addEventListener('popstate',resetRoute);
 document.querySelectorAll('.nav a[data-section],.world-logo').forEach(a=>a.addEventListener('click',()=>{reader.scrollTop=0;schedule()}));
 window.addEventListener('chapterchange',()=>{const current=document.querySelector('.topbar .nav a[aria-current="page"]');if(current){const nav=current.parentElement;nav.scrollLeft=Math.max(0,current.offsetLeft-nav.offsetLeft-(nav.clientWidth-current.clientWidth)/2)}schedule()});
 document.querySelectorAll('.goddess').forEach(n=>n.addEventListener('wheel',e=>{if(e.ctrlKey||!document.body.classList.contains('stage-mode'))return;reader.scrollTop+=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?reader.clientHeight:1);e.preventDefault()},{passive:false}));
 thumb.addEventListener('pointerdown',e=>{drag={y:e.clientY,scroll:reader.scrollTop};thumb.setPointerCapture(e.pointerId);e.preventDefault();e.stopPropagation()});
 thumb.addEventListener('pointermove',e=>{if(!drag)return;const free=track.clientHeight-thumb.clientHeight;if(free>0)reader.scrollTop=drag.scroll+(e.clientY-drag.y)*(reader.scrollHeight-reader.clientHeight)/free});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])thumb.addEventListener(event,()=>drag=null);
 track.addEventListener('pointerdown',e=>{if(e.target!==thumb)reader.scrollTop+=(e.clientY<thumb.getBoundingClientRect().top?-1:1)*reader.clientHeight*.85});
 track.addEventListener('keydown',e=>{const delta={ArrowDown:60,ArrowUp:-60,PageDown:reader.clientHeight*.85,PageUp:-reader.clientHeight*.85}[e.key];if(delta!==undefined){reader.scrollTop+=delta;e.preventDefault()}else if(e.key==='Home'||e.key==='End'){reader.scrollTop=e.key==='Home'?0:reader.scrollHeight;e.preventDefault()}});
 track.addEventListener('wheel',e=>{if(e.ctrlKey)return;reader.scrollTop+=e.deltaY;e.preventDefault()},{passive:false});
 reader.addEventListener('scroll',schedule);reader.addEventListener('load',schedule,true);
 new ResizeObserver(schedule).observe(reader);new ResizeObserver(schedule).observe(cap);
 new MutationObserver(schedule).observe(reader,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 schedule();
})();
