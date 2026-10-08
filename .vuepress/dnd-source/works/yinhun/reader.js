function readerLabel(route){
 if(!route)return '';if(route.kind==='volume')return '第 '+route.id+' 卷'+(readerLimit()>=route.id?' · '+DATA.volumes[route.id-1].title:' · 未解锁');
 if(route.kind==='event'){const e=DATA.events.find(x=>x.id===route.id);return e.volume<=readerLimit()?e.title:'第 '+e.volume+' 卷事件 · 未解锁'}
 if(route.kind==='character'){const c=DATA.characters.find(x=>x.id===route.id);return readerKnown(c)?(readerFull()?c.name:safeName(c))+(route.variant?' · 插画 '+(route.variant+1):''):'人物收藏 · 未解锁'}
 return ({world:'世界观',history:'历史脉络',volumes:'卷纲',events:'重大事件',characters:'人物档案',relations:'关系图谱',boundaries:'未解线索'})[route.id]||'';
}
function readerDesk(){
 $('#reader-storage').textContent=readerStorage?'阅读位置与收藏保存在当前浏览器；可导出备份。':'浏览器无法保存本地数据；本次仍可使用，关闭页面后不会保留。';
 $$('[data-reader-save]').forEach(b=>{const on=readerState.saved.includes(b.dataset.readerSave);b.setAttribute('aria-pressed',on);b.textContent=on?'★ 已收藏':'☆ 收藏'});
 $('#reader-save-book').setAttribute('aria-pressed',readerState.book);$('#reader-save-book').textContent=readerState.book?'★ 已收藏作品':'☆ 收藏作品';
 $('#reader-resume').innerHTML=readerState.last?`<span>上次阅读 · ${esc(readerLabel(readerState.last))}</span><button class="btn gold" data-reader-resume>继续阅读 →</button>`:'<span>打开卷纲、事件或人物，会自动记住阅读位置。</span>';
 $('#reader-saved').innerHTML=readerState.saved.length?readerState.saved.map(key=>{const[k,id]=key.split(':');return `<div class="reader-saved-row"><button class="source-btn" data-reader-open="${esc(key)}">${esc(readerLabel({kind:k,id:k==='volume'?Number(id):id}))} ↗</button><button class="source-btn" data-reader-save="${esc(key)}" aria-label="移除这条收藏" aria-pressed="true">移除</button></div>`}).join(''):'<p class="small-note">尚未收藏卷纲、事件或人物。</p>';
 $('#reader-clear').disabled=!readerState.last;
}
function readerApply(){
 const wasBooting=readerBooting;readerBooting=true;
 const full=readerFull(),limit=readerLimit();document.documentElement.dataset.readerMode=readerState.mode;
 $$('#history,#volumes,#events,#characters,#relations').forEach(n=>n.hidden=readerState.mode==='intro');
 const start=$('.hero-links a');start.href=limit?'#volumes':'#reading';start.textContent=limit?'沿着剧情阅读 ↓':'设置阅读进度 ↓';
 $('#reader-mode').value=readerState.mode;$('#reader-volume').value=readerState.volume;$('#reader-volume-field').hidden=readerState.mode!=='progress';
 $('#reader-mode-note').textContent=full?'完整剧透：当前收录范围内的所有剧情均可见。':limit?'已读至第 '+limit+' 卷末。卷纲使用卷内事件；跨卷分析、人物评价、完整关系与剧情画廊标题暂时隐藏。':'无剧透介绍：先认识作品与基础概念；剧情、人物和关系尚未展开。';
 $('.intro').textContent=full?'一名阴魂城巫师的远行，从一封信开始，穿过瘟疫、深渊与神祇的棋局，最终触及被遗忘的帝国和自己的过去。':'以费伦为舞台的魔幻小说，围绕琼恩的成长与选择展开。先认识这个世界，再按自己的阅读进度探索。';
 $$('.volume-tab').forEach(b=>{const n=Number(b.dataset.volumeTab);b.disabled=n>limit;b.textContent=n<=limit?'第 '+n+' 卷 · '+DATA.volumes[n-1].title:'第 '+n+' 卷 · 未解锁'});
 $$('.volume-panel').forEach((panel,i)=>{
  const v=DATA.volumes[i];panel.innerHTML=readerOriginal.volumes[i];
  if(!full){const events=DATA.events.filter(e=>e.volume===v.number);panel.innerHTML=`<div class="volume-top"><h3>第 ${v.number} 卷 · ${esc(v.title)}</h3></div><p class="small-note">按卷内事件回顾，跨卷反转与综合评价暂不显示。</p><ol class="turns">${events.map(e=>`<li><strong>${esc(e.title)}</strong><p>${esc(e.action)}</p></li>`).join('')}</ol>`;}
  panel.insertAdjacentHTML('beforeend',readerTools('volume',v.number));panel.hidden=true;
 });
 $$('.cast-card').forEach((node,i)=>{const c=DATA.characters[i];node.innerHTML=readerOriginal.cards[i];node.hidden=!readerKnown(c);if(!full){$('.cast-info h3',node).textContent=safeName(c);$('.cast-info p',node).textContent='已读卷内的人物';$('.faction',node).textContent='查看插画与卷内记录';node.setAttribute('aria-label','查看'+safeName(c)+'的已读卷内记录');$('img',node).alt=safeName(c)+' · 艺术演绎';}});
 $$('.event-card').forEach((node,i)=>{const e=DATA.events[i];node.innerHTML=readerOriginal.events[i];if(!full){$('.event-chain',node).innerHTML=`<div class="chain"><b>卷内记录</b><p>${esc(e.action)}</p></div><p class="small-note">前因与后果中的跨卷评价暂不显示。</p>`;}node.open=false;node.insertAdjacentHTML('beforeend',readerTools('event',e.id));});
 $$('#event-volume option').forEach(o=>{const n=Number(o.value);if(n){o.disabled=n>limit;o.textContent=n<=limit?'第 '+n+' 卷 · '+DATA.volumes[n-1].title:'第 '+n+' 卷 · 未解锁'}});
 eventVolume.value='0';eventSearch.value='';eventLimit=8;updateEvents();
 $('#reader-volumes-empty').hidden=limit>0;$('#reader-characters-empty').hidden=limit>0;
 // These summaries and labels contain later revelations even when their subject appeared early.
 $$('.story-road,.world-grid,.planes,#history .timeline,#supporting,#relations .relationship,#boundaries .mysteries').forEach(n=>n.hidden=!full);
 $('#reader-relations-note').hidden=full;$('#reader-world-note').hidden=full;$('#reader-history-note').hidden=full;$('#reader-boundaries-note').hidden=full;
 if(full)renderRelations('qiong-en');else{$('#relationship-graph').replaceChildren();$('#relation-list').replaceChildren();$('#relation-name').textContent='完整关系暂时隐藏';$('#relation-subtitle').textContent='';}
 $$('[data-reader-lore-source]').forEach(b=>{const x=LORE.find(x=>x.id===b.dataset.readerLoreSource);b.disabled=!readerCitations(x.citations.map(index=>({index}))).length;});
 const active=readerState.last?.kind==='volume'&&readerState.last.id<=limit?readerState.last.id:1;if(limit)setVolume(active);
 readerDesk();document.documentElement.classList.add('reader-ready');readerBooting=wasBooting;
}
function readerOpen(route){
 if(!route)return;
 if(route.kind==='volume'){if(route.id>readerLimit())return readerNotice('此卷尚未解锁。请先调整已读进度。');setVolume(route.id);$('#volumes').scrollIntoView();}
 if(route.kind==='event'){const e=DATA.events.find(x=>x.id===route.id);if(e.volume>readerLimit())return readerNotice('此事件尚未解锁。请先调整已读进度。');eventVolume.value=String(e.volume);eventSearch.value='';eventLimit=100;updateEvents();const node=document.getElementById(e.id);node.open=true;node.scrollIntoView();readerRemember('event',e.id);}
 if(route.kind==='character'){const c=DATA.characters.find(x=>x.id===route.id);if(!readerKnown(c))return readerNotice('此人物暂未解锁。请先调整已读进度。');showCharacter(c.id);if(activeGallery&&route.variant)activeGallery.go(route.variant);}
 if(route.kind==='section'){document.getElementById(route.id)?.scrollIntoView();readerRemember('section',route.id);}
}
function readerLore(id){
 const x=LORE.find(x=>x.id===id);if(!x)return;
 showDialog(`<div class="source-detail"><div class="eyebrow">NOVEL × CODEX / 概念对照</div><h2>${esc(x.name)}</h2><h4>官方设定 · 基础概念</h4><p>${esc(x.official)}</p><a class="source-btn" href="${esc(x.source)}" target="_blank" rel="noopener">${esc(x.source_title)} ↗</a><h4>小说中的用法</h4><p>${esc(x.novel)}</p><h4>对应范围与待核实差异</h4><p>${esc(x.boundary)}</p><p class="small-note">编者整理 · 官方来源核对日期 ${esc(x.checked)}。小说依据来自所提供的 HTML，未重新核对 EPUB。</p><button class="source-btn" data-reader-lore-source="${esc(id)}" ${readerCitations(x.citations.map(index=>({index}))).length?'':'disabled'}>查看已读范围内的小说章节依据 ↗</button><p class="small-note">百科完整档案可能含官方历史信息；这是游戏设定资料，不等于小说未来剧情。</p><a class="btn gold" href="/dnd/#entry/${esc(id)}">打开百科档案 ↗</a></div>`);
}
$('#reader-mode').onchange=()=>{readerState.mode=$('#reader-mode').value;if(dialog.open)closeDialog();readerApply();readerPersist();};
$('#reader-volume').onchange=()=>{readerState.volume=Number($('#reader-volume').value);if(dialog.open)closeDialog();readerApply();readerPersist();};
$('#reader-save-book').onclick=()=>{readerState.book=!readerState.book;readerPersist()};
$('#reader-clear').onclick=()=>{readerState.last=null;readerPersist();readerNotice('阅读位置已清空，收藏和剧透设置已保留。')};
$$('.event-card').forEach(n=>n.addEventListener('toggle',()=>{if(n.open&&!n.hidden){const e=DATA.events.find(x=>x.id===n.id);if(e.volume<=readerLimit())readerRemember('event',n.id);}}));
document.addEventListener('click',e=>{
 const save=e.target.closest('[data-reader-save]');if(save){const k=save.dataset.readerSave;readerState.saved=readerState.saved.includes(k)?readerState.saved.filter(x=>x!==k):[...readerState.saved,k];readerPersist()}
 const resume=e.target.closest('[data-reader-resume]');if(resume)readerOpen(readerState.last);
 const open=e.target.closest('[data-reader-open]');if(open){const[k,id]=open.dataset.readerOpen.split(':');readerOpen({kind:k,id:k==='volume'?Number(id):id});}
 const lore=e.target.closest('[data-reader-lore]');if(lore)readerLore(lore.dataset.readerLore);
 const source=e.target.closest('[data-reader-lore-source]');if(source){const x=LORE.find(x=>x.id===source.dataset.readerLoreSource);showDialog(sources(x.citations.map(index=>({index,note:'核对小说中的概念用法；不将具体情节归入官方设定。'})),x.name+' · 小说依据'));}
 const section=e.target.closest('.nav-links a');if(section&&section.hash!=='#reading'&&document.querySelector(section.hash)){if(document.querySelector(section.hash).hidden){e.preventDefault();$('#reading').scrollIntoView();readerNotice('请先选择已读进度，再打开剧情内容。');}else readerRemember('section',section.hash.slice(1));}
 const cv=e.target.closest('[data-volume-events]');if(cv&&Number(cv.dataset.volumeEvents)<=readerLimit()){eventVolume.value=cv.dataset.volumeEvents;eventSearch.value='';eventLimit=8;updateEvents();$('#events').scrollIntoView();readerRemember('volume',Number(cv.dataset.volumeEvents));}
});
window.addEventListener('dnd-reading-imported',()=>{readerState=DndReadingBackup.work(DndReadingBackup.read(DndReadingBackup.workKey));readerDesk()});
window.addEventListener('storage',e=>{if(e.key===DndReadingBackup.workKey){readerState=DndReadingBackup.work(DndReadingBackup.read(DndReadingBackup.workKey));if(dialog.open)closeDialog();readerApply()}});
function readerRoute(){const parts=location.hash.slice(1).split('/');if(parts[0]==='lore')readerLore(parts[1]);}
window.addEventListener('hashchange',readerRoute);
readerApply();readerBooting=false;readerRoute();
