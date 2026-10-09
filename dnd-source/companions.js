(()=>{
 'use strict';
 const catalog=JSON.parse(document.getElementById('companion-data').textContent),byId=new Map(catalog.map(x=>[x.id,x]));
 const defaults={left:'mystra',right:'shar'},settings=window.dndWorldAppearance||{},selected={left:byId.has(settings.left)?settings.left:defaults.left,right:byId.has(settings.right)?settings.right:defaults.right};
 const figures=Object.fromEntries([...document.querySelectorAll('.goddess[data-side]')].map(n=>[n.dataset.side,n]));
 const dialog=document.getElementById('companion-dialog'),summary=document.getElementById('companion-summary'),status=document.getElementById('companion-status');
 const narrow=matchMedia('(max-width:1100px)'),tokens={left:0,right:0},pending={left:null,right:null},loads=new Map();let side='left';
 const srcset=x=>x.variants.filter(v=>v.width>=360).map(v=>`${v.url} ${v.width}w`).join(', ');
 const visible=()=>document.body.classList.contains('stage-mode')&&!narrow.matches;
 function say(text){status.textContent=text;document.getElementById('companion-dialog-status').textContent=text}
 function save(){window.dndWorldAppearance={...window.dndWorldAppearance,...selected};try{localStorage.setItem('dnd-world-appearance-v1',JSON.stringify(window.dndWorldAppearance))}catch{}}
 function paint(position){
  const figure=figures[position],character=byId.get(selected[position]),img=figure.querySelector('img'),source=figure.querySelector('source');
  figure.className='goddess '+character.id;figure.dataset.character=character.id;figure.setAttribute('aria-label',character.name+'的艺术演绎');figure.style.setProperty('--companion-glow',character.glow);
  figure.dataset.mirror=String(character.facing!==(position==='left'?'right':'left'));
  img.alt=character.name+'的全身概念插画';
  if(visible())source.srcset=srcset(character);else source.removeAttribute('srcset');
 }
 function refresh(){
  summary.textContent=`左侧：${byId.get(selected.left).name}　·　右侧：${byId.get(selected.right).name}`;
  dialog.querySelectorAll('[data-pick-side]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.pickSide===side));
  dialog.querySelectorAll('.companion-option').forEach(b=>{const on=b.dataset.character===selected[side];b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',`选择${side==='left'?'左':'右'}侧人物：${byId.get(b.dataset.character).name}${on?'，当前已选':''}`)});
  dialog.querySelectorAll('[data-pick-side]').forEach(b=>b.setAttribute('aria-busy',String(Boolean(pending[b.dataset.pickSide]))));
 }
 function preload(character){
  if(!loads.has(character.id)){
   const img=new Image();img.decoding='async';img.sizes='18vw';img.srcset=srcset(character);img.src=character.variants.find(v=>v.width===360).url;
   const promise=img.decode().catch(e=>{loads.delete(character.id);throw e});loads.set(character.id,promise);
  }
  return loads.get(character.id);
 }
 async function choose(position,id){
  if(!byId.has(id)||!figures[position])return false;
  const token=++tokens[position],character=byId.get(id);pending[position]=id;figures[position].setAttribute('aria-busy','true');refresh();
  try{
   if(visible())await preload(character);
   if(token!==tokens[position])return false;
   selected[position]=id;paint(position);save();say(`${position==='left'?'左':'右'}侧已切换为${character.name}`);return true;
  }catch{
   if(token===tokens[position])say('插图暂未加载成功，请稍后重试。');return false;
  }finally{
   if(token===tokens[position]){pending[position]=null;figures[position].setAttribute('aria-busy','false');refresh()}
  }
 }
 function open(position='left'){
  side=position;refresh();say('');
  dialog.querySelectorAll('img[data-src]').forEach(img=>{if(!img.getAttribute('src'))img.src=img.dataset.src});
  if(!dialog.open)dialog.showModal();
  dialog.querySelector(`[data-pick-side="${side}"]`).focus();
 }
 document.getElementById('companion-picker').addEventListener('click',()=>open());
 Object.entries(figures).forEach(([position,figure])=>{
  figure.querySelector('.companion-choose').addEventListener('click',()=>open(position));
  figure.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',()=>{
   const index=catalog.findIndex(x=>x.id===(pending[position]||selected[position]));
   choose(position,catalog[(index+Number(button.dataset.direction)+catalog.length)%catalog.length].id);
  }));
 });
 dialog.addEventListener('click',e=>{
  const tab=e.target.closest('[data-pick-side]');if(tab){side=tab.dataset.pickSide;refresh()}
  const card=e.target.closest('.companion-option');if(card)choose(side,card.dataset.character);
  const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();
 });
 document.getElementById('companion-reset').addEventListener('click',async()=>{
  const result=await Promise.all([choose('left',defaults.left),choose('right',defaults.right)]);
  say(result.every(Boolean)?'已恢复密斯特拉与莎尔。':'部分插图暂未加载成功，请重试。');
 });
 // Keep existing search and gallery shortcuts from opening a second modal.
 dialog.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopPropagation()}});
 function sync(){Object.keys(figures).forEach(paint)}
 narrow.addEventListener('change',sync);document.getElementById('layout-select').addEventListener('change',sync);
 sync();refresh();
})();
