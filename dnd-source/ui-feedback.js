/* Short state feedback; keyboard and reduced-motion actions stay immediate. */
(()=>{
 'use strict';
 const reduce=matchMedia('(prefers-reduced-motion:reduce)'),animations=new WeakMap();
 document.documentElement.dataset.inputMode='pointer';
 document.addEventListener('pointerdown',()=>document.documentElement.dataset.inputMode='pointer',true);
 document.addEventListener('keydown',()=>document.documentElement.dataset.inputMode='keyboard',true);
 function animate(node,frames,duration=200){
  animations.get(node)?.cancel();
  if(reduce.matches||document.documentElement.dataset.inputMode==='keyboard'||!node.animate)return;
  const motion=node.animate(frames,{duration,easing:'cubic-bezier(0.23,1,0.32,1)'});animations.set(node,motion);
 }
 const observer=new MutationObserver(records=>{for(const r of records){const dialog=r.target;if(!dialog.matches('dialog'))continue;if(dialog.open&&dialog.id!=='search-dialog')animate(dialog,[{opacity:0,transform:'scale(.97)'},{opacity:1,transform:'scale(1)'}]);else if(!dialog.open)animations.get(dialog)?.cancel()}});
 // Online companion/mobile dialogs are parsed after this shared script.
 observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 document.getElementById('theme-button')?.addEventListener('click',()=>animate(document.getElementById('main'),[{opacity:.88},{opacity:1}],160));
})();
