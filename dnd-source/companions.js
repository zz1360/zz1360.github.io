(()=>{
 'use strict';
 const catalog=JSON.parse(document.getElementById('companion-data').textContent),byId=new Map(catalog.map(x=>[x.id,x]));
 const defaults={left:'mystra',right:'shar'},settings=window.dndWorldAppearance||{},selected={left:byId.has(settings.left)?settings.left:defaults.left,right:byId.has(settings.right)?settings.right:defaults.right};
 const figures=Object.fromEntries([...document.querySelectorAll('.goddess[data-side]')].map(n=>[n.dataset.side,n]));
 const dialog=document.getElementById('companion-dialog'),summary=document.getElementById('companion-summary'),status=document.getElementById('companion-status'),list=dialog.querySelector('.companion-options-scroll'),retry=document.getElementById('companion-retry');
 const narrow=matchMedia('(max-width:1100px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)'),tokens={left:0,right:0},pending={left:null,right:null},failed={left:null,right:null},loads=new Map();let side='left';
 const srcset=x=>x.variants.filter(v=>v.width>=360).map(v=>`${v.url} ${v.width}w`).join(', '),sideName=position=>position==='left'?'左':'右';
 const visible=()=>document.body.classList.contains('stage-mode')&&!narrow.matches;
 const pointerAction=e=>e.detail>0&&!reduced.matches;
 function say(text){status.textContent=text;document.getElementById('companion-dialog-status').textContent=text}
 function save(){window.dndWorldAppearance={...window.dndWorldAppearance,...selected};try{localStorage.setItem('dnd-world-appearance-v1',JSON.stringify(window.dndWorldAppearance))}catch{}}
 function paint(position){
  const figure=figures[position],character=byId.get(selected[position]),img=figure.querySelector('.goddess-art'),source=figure.querySelector('source');
  figure.className='goddess '+character.id;figure.dataset.character=character.id;figure.setAttribute('aria-label',character.name+'的艺术演绎');figure.style.setProperty('--companion-glow',character.glow);
  figure.dataset.mirror=String(character.facing!==(position==='left'?'right':'left'));
  img.alt=character.name+'的全身概念插画';
  if(visible())source.srcset=srcset(character);else source.removeAttribute('srcset');
 }
 function reveal(position,motion){
  const picture=figures[position].querySelector('picture');
  // A new choice interrupts the old fade; keyboard/reduced-motion updates are
  // immediate. The image has been decoded before it reaches the reader.
  picture.dataset.motion='false';picture.style.opacity=motion&&visible()?'.6':'1';paint(position);
  if(motion&&visible()){getComputedStyle(picture).opacity;picture.dataset.motion='true';picture.style.opacity='1'}
 }
 function preview(position){
  if(!dialog.open)return;
  const tab=dialog.querySelector(`[data-pick-side="${position}"]`),img=tab.querySelector('img'),character=byId.get(selected[position]);
  if(tab.dataset.previewCharacter===character.id)return;
  tab.dataset.previewCharacter=character.id;tab.dataset.previewState='loading';
  const loader=new Image();loader.decoding='async';
  loader.onload=()=>{if(tab.dataset.previewCharacter!==character.id)return;img.src=loader.src;img.dataset.character=character.id;tab.dataset.previewState='ready';refresh()};
  loader.onerror=()=>{if(tab.dataset.previewCharacter!==character.id)return;tab.dataset.previewState='error';refresh()};
  loader.src=character.variants[0].url;
 }
 function refresh(){
  summary.textContent=`左侧：${byId.get(selected.left).name}　·　右侧：${byId.get(selected.right).name} · 选择后自动保存`;
  dialog.querySelectorAll('[data-pick-side]').forEach(tab=>{
   const position=tab.dataset.pickSide,character=byId.get(selected[position]),loading=pending[position];
   tab.setAttribute('aria-pressed',position===side);tab.setAttribute('aria-busy',String(Boolean(loading)));tab.setAttribute('aria-label',`${sideName(position)}侧人物：${character.name}，${position===side?'正在选择此侧':'点击更换此侧'}`);
   tab.querySelector('strong').textContent=character.name;preview(position);
   tab.querySelector('.companion-side-state').textContent=loading?`正在载入${byId.get(loading).name}…`:failed[position]?'切换失败 · 仍保留当前人物':tab.dataset.previewState==='error'?'缩略图未加载 · 点击重试':tab.dataset.previewState==='loading'?'缩略图加载中…':position===side?'正在选择此侧':'点击更换此侧';
  });
  dialog.querySelectorAll('.companion-option').forEach(button=>{
   const id=button.dataset.character,on=id===selected[side],loading=id===pending[side],error=id===failed[side];
   button.setAttribute('aria-pressed',on);button.setAttribute('aria-busy',String(loading));button.dataset.switchState=loading?'loading':error?'error':'ready';
   button.setAttribute('aria-label',`选择${sideName(side)}侧人物：${byId.get(id).name}${on?'，当前已选':''}${loading?'，正在载入':error?'，载入失败，点击重试':''}`);
   button.querySelector('.companion-switch-state').textContent=loading?'切换中…':error?'载入失败 · 点击重试':on?'当前已选':'';
  });
  Object.entries(figures).forEach(([position,figure])=>{
   const loading=pending[position],error=failed[position],feedback=figure.querySelector('.companion-figure-feedback');
   figure.setAttribute('aria-busy',String(Boolean(loading)));feedback.hidden=!loading&&!error;
   feedback.querySelector('span').textContent=loading?`正在载入${byId.get(loading).name}…`:`未加载成功，保留${byId.get(selected[position]).name}`;
   feedback.querySelector('button').hidden=!error||Boolean(loading);
  });
  retry.hidden=!failed[side]||Boolean(pending[side]);if(!retry.hidden)retry.textContent=`重试${sideName(side)}侧 · ${byId.get(failed[side]).name}`;
 }
 function preload(character){
  if(!loads.has(character.id)){
   const img=new Image();img.decoding='async';img.sizes='18vw';img.srcset=srcset(character);img.src=character.variants.find(v=>v.width===360).url;
   const promise=img.decode().catch(e=>{loads.delete(character.id);throw e});loads.set(character.id,promise);
  }
  return loads.get(character.id);
 }
 async function choose(position,id,motion=false){
  if(!byId.has(id)||!figures[position])return false;
  const token=++tokens[position],character=byId.get(id);pending[position]=id;failed[position]=null;refresh();say(`正在载入${sideName(position)}侧人物：${character.name}…`);
  try{
   if(visible())await preload(character);
   if(token!==tokens[position])return false;
   selected[position]=id;reveal(position,motion);save();say(`${sideName(position)}侧已切换为${character.name}，已保存。`);return true;
  }catch{
   if(token===tokens[position]){failed[position]=id;say(`${character.name}的插图未加载成功，仍保留${byId.get(selected[position]).name}。可点击重试。`)}return false;
  }finally{
   if(token===tokens[position]){pending[position]=null;refresh()}
  }
 }
 function locate(){
  const card=dialog.querySelector(`.companion-option[data-character="${selected[side]}"]`);if(!card)return;
  const bounds=list.getBoundingClientRect(),target=card.getBoundingClientRect();
  list.scrollTo({top:Math.max(0,list.scrollTop+target.top-bounds.top-12),behavior:'instant'});
 }
 function loadThumbnail(img){
  const card=img.closest('.companion-option');card.dataset.thumbState='loading';card.querySelector('.companion-thumb-state').textContent='缩略图加载中…';
  img.onload=()=>{card.dataset.thumbState='ready';card.querySelector('.companion-thumb-state').textContent=''};
  img.onerror=()=>{card.dataset.thumbState='error';card.querySelector('.companion-thumb-state').textContent='缩略图未加载 · 点击重试'};
  img.src=img.dataset.src;
 }
 function open(position='left'){
  if(!visible())return;side=position;
  dialog.querySelectorAll('img[data-src]').forEach(img=>{if(!img.getAttribute('src'))loadThumbnail(img)});
  if(!dialog.open)dialog.showModal();refresh();if(!failed[side])say('');
  locate();dialog.querySelector(`[data-pick-side="${side}"]`).focus({preventScroll:true});
 }
 document.getElementById('companion-picker').addEventListener('click',()=>open());
 Object.entries(figures).forEach(([position,figure])=>{
  figure.querySelector('.companion-choose').addEventListener('click',()=>open(position));
  figure.querySelector('.companion-figure-feedback button').addEventListener('click',e=>{if(failed[position])choose(position,failed[position],pointerAction(e))});
  figure.querySelectorAll('[data-direction]').forEach(button=>button.addEventListener('click',e=>{
   const index=catalog.findIndex(x=>x.id===(pending[position]||selected[position]));
   choose(position,catalog[(index+Number(button.dataset.direction)+catalog.length)%catalog.length].id,pointerAction(e));
  }));
 });
 dialog.addEventListener('click',e=>{
  const tab=e.target.closest('[data-pick-side]');if(tab){side=tab.dataset.pickSide;if(tab.dataset.previewState==='error')tab.dataset.previewCharacter='';refresh();locate()}
  const card=e.target.closest('.companion-option');if(card){if(card.dataset.thumbState==='error')loadThumbnail(card.querySelector('img'));choose(side,card.dataset.character,pointerAction(e))}
  const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();
 });
 retry.addEventListener('click',e=>{if(failed[side])choose(side,failed[side],pointerAction(e))});
 document.getElementById('companion-reset').addEventListener('click',async e=>{
  const tasks=[choose('left',defaults.left,pointerAction(e)),choose('right',defaults.right,pointerAction(e))],resetTokens={...tokens},result=await Promise.all(tasks);
  if(tokens.left!==resetTokens.left||tokens.right!==resetTokens.right)return;
  say(result.every(Boolean)?'已恢复密斯特拉与莎尔，已保存。':'部分插图未加载成功，仍保留原人物，可重试。');
 });
 // Keep existing search and gallery shortcuts from opening a second modal.
 dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopPropagation()}});
 function sync(){Object.keys(figures).forEach(paint);if(!visible()&&dialog.open){dialog.close();if(narrow.matches)document.getElementById('main').focus({preventScroll:true})}refresh()}
 narrow.addEventListener('change',sync);window.addEventListener('readerlayoutchange',sync);
 sync();refresh();
})();
