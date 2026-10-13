(()=>{
 'use strict';
 const reader=document.getElementById('main'),track=document.querySelector('.reader-scrollbar'),thumb=track.firstElementChild,cap=document.querySelector('.chamber-cap'),selector=document.getElementById('layout-select'),theme=document.getElementById('theme-button');
 const key='dnd-world-appearance-v1',narrow=matchMedia('(max-width:1100px)'),companionOption=selector.querySelector('[value="companions"]');let drag=null,pending=false,desktopLayout=window.dndWorldAppearance?.layout==='original'?'original':'companions';
 function persist(){window.dndWorldAppearance={...window.dndWorldAppearance,layout:desktopLayout,light:document.body.classList.contains('light')};try{localStorage.setItem(key,JSON.stringify(window.dndWorldAppearance))}catch{}}
 function update(){
  pending=false;const range=reader.scrollHeight-reader.clientHeight;
  if(!document.body.classList.contains('stage-mode')||range<=0){track.hidden=true;return}
  track.hidden=false;track.style.top=(cap.offsetHeight+8)+'px';
  const h=track.clientHeight,size=Math.min(h,Math.max(34,h*reader.clientHeight/Math.max(reader.scrollHeight,1)));
  thumb.style.height=size+'px';thumb.style.top=((h-size)*reader.scrollTop/range)+'px';track.setAttribute('aria-valuenow',Math.round(100*reader.scrollTop/range));
 }
 function schedule(){if(!pending){pending=true;requestAnimationFrame(update)}}
 function applyLayout(keepPosition=true){
  const wasStage=document.body.classList.contains('stage-mode'),offset=wasStage?reader.scrollTop:window.scrollY,effective=narrow.matches?'original':desktopLayout;
  document.body.classList.toggle('stage-mode',effective==='companions');document.body.classList.toggle('mobile-reader',narrow.matches);
  // The mobile reader has no portrait layout. Its temporary effective mode
  // must never overwrite the user's saved desktop choice.
  if(narrow.matches)companionOption.remove();else if(!companionOption.isConnected)selector.prepend(companionOption);
  selector.disabled=narrow.matches;selector.value=effective;
  if(keepPosition&&wasStage!==(effective==='companions'))requestAnimationFrame(()=>{(effective==='original'?window:reader).scrollTo({top:offset,behavior:'instant'});schedule()});
  window.dispatchEvent(new CustomEvent('readerlayoutchange',{detail:{layout:effective,desktopLayout,mobile:narrow.matches}}));schedule();
 }
 applyLayout(false);
 function refreshTheme(){const light=document.body.classList.contains('light');theme.textContent=light?'深色':'浅色';theme.setAttribute('aria-label','切换到'+(light?'深色':'浅色')+'阅读模式')}
 refreshTheme();theme.addEventListener('click',()=>{refreshTheme();persist()});
 selector.addEventListener('change',()=>{if(narrow.matches)return;desktopLayout=selector.value==='original'?'original':'companions';applyLayout();persist()});
 narrow.addEventListener('change',()=>applyLayout());
 // Navigation owns position restoration. The stage only updates its scrollbar.
 window.addEventListener('hashchange',schedule);window.addEventListener('popstate',schedule);
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
