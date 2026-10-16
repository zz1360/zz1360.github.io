/* Diagram targets remain stable; a compact note opens only on request. */
(()=>{
 const root=document.querySelector('[data-setting-overview]');if(!root)return;
 const panel=root.querySelector('#setting-note-panel'),body=root.querySelector('#setting-note-body'),buttons=[...root.querySelectorAll('[data-setting-node]')];let selected=null;
 function close(){if(panel.hidden)return;panel.hidden=true;buttons.forEach(b=>b.setAttribute('aria-expanded','false'));if(selected){selected.focus({preventScroll:true});selected.scrollIntoView({block:'nearest',behavior:'instant'})}}
 buttons.forEach(button=>button.addEventListener('click',()=>{
  if(selected===button&&!panel.hidden){close();return}
  const template=root.querySelector('#setting-note-'+button.dataset.settingNode);if(!template)return;
  selected=button;buttons.forEach(b=>b.setAttribute('aria-expanded',String(b===button)));body.replaceChildren(template.content.cloneNode(true));panel.hidden=false;
  body.querySelector('h3').focus({preventScroll:true});panel.scrollIntoView({block:'nearest',behavior:'instant'});
 }));
 root.querySelector('.setting-note-close').addEventListener('click',close);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!root.hidden&&!panel.hidden&&!document.querySelector('dialog[open]')){event.preventDefault();close()}});
 const sceneDialog=root.querySelector('#setting-scene-dialog'),sceneTrigger=root.querySelector('.setting-scene-launch'),image=sceneDialog.querySelector('img'),status=sceneDialog.querySelector('[role=status]');
 image.addEventListener('load',()=>status.hidden=true);
 image.addEventListener('error',()=>{status.textContent='插画暂未载入，请关闭后重试。';status.hidden=false});
 sceneTrigger.addEventListener('click',()=>{status.hidden=image.complete&&image.naturalWidth>0;if(!status.hidden){status.textContent='正在展开原画…';image.src=image.dataset.full}sceneDialog.showModal()});
 root.querySelector('[data-setting-scene-close]').addEventListener('click',()=>sceneDialog.close());
 sceneDialog.addEventListener('close',()=>sceneTrigger.focus({preventScroll:true}));
 sceneDialog.addEventListener('click',event=>{const r=sceneDialog.getBoundingClientRect();if(event.target===sceneDialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))sceneDialog.close()});
 window.addEventListener('chapterchange',event=>{if(event.detail!=='worlds'&&sceneDialog.open)sceneDialog.close()});
})();
