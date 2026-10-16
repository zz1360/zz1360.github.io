/* Setting URLs are explicit: sharing a link never relies on a local preference. */
(()=>{
 const config=JSON.parse(document.getElementById('settings-data').textContent),selects=[...document.querySelectorAll('[data-setting-select]')];
 for(const select of selects){select.value=config.current.id;select.addEventListener('change',()=>{
  const target=config.catalog.find(x=>x.id===select.value);if(!target||target.id===config.current.id)return;
  const section=document.querySelector('.topbar .nav [aria-current="page"][data-section]')?.dataset.section||'overview';
  window.codexNavigation?.capture();const url=new URL(target.path,location.origin);url.hash=section;location.assign(url.href);
 })}
 // Companion illustrations are independent of the setting's actual inhabitants.
 const picker=document.getElementById('companion-summary');if(picker)picker.insertAdjacentHTML('afterend','<p class="setting-art-note">伴读插画独立于当前设定，人物档案以所选设定为准。</p>');
})();
