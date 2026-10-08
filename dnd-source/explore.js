'use strict';
const RELATIONS=JSON.parse(document.getElementById('relations-data').textContent);
const HISTORY_FLOW=JSON.parse(document.getElementById('history-flow-data').textContent);
const STORAGE_KEY='dnd-codex-reading-v1';
let readingState={saved:[],recent:[]},storageAvailable=true,noticeTimer;
try{
 const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
 if(raw&&typeof raw==='object'){
  readingState.saved=[...new Set(Array.isArray(raw.saved)?raw.saved.filter(id=>typeof id==='string'&&BYID[id]):[])];
  readingState.recent=(Array.isArray(raw.recent)?raw.recent:[]).filter(x=>x&&BYID[x.id]&&Number.isFinite(x.time)).slice(0,10).map(x=>({id:x.id,mode:x.mode==='art'&&document.getElementById('art-'+x.id)?'art':'entry',variant:Number.isInteger(x.variant)?Math.max(0,Math.min(x.variant,GALLERY_DATA[x.id]?.length||0)):0,time:x.time}));
 }
}catch(e){if(e.name!=='SyntaxError')storageAvailable=false}
function persistReading(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(readingState));storageAvailable=true}catch{storageAvailable=false}renderReading()}
function rememberEntry(id,mode='entry',variant=0){readingState.recent=[{id,mode,variant,time:Date.now()},...readingState.recent.filter(x=>x.id!==id)].slice(0,10);persistReading()}
function readingRoute(x){return '#'+(x.mode==='art'?'art/'+x.id+'/'+x.variant:'entry/'+x.id)}
function announce(message){
 const node=document.getElementById('codex-notice');clearTimeout(noticeTimer);
 const top=document.getElementById('share-dialog').open?document.getElementById('share-dialog'):artDialog.open?artDialog:entryDialog.open?entryDialog:document.body;
 top.append(node);node.textContent=message;node.hidden=false;
 noticeTimer=setTimeout(()=>{node.hidden=true;document.body.append(node)},2500);
}
function renderReading(){
 const saved=readingState.saved,recent=readingState.recent;
 document.getElementById('reading-storage-status').textContent=storageAvailable?'':'浏览器不允许保存本地数据；本次阅读仍可收藏，关闭页面后不会保留。';
 document.getElementById('saved-count').textContent=saved.length;
 document.getElementById('saved-entries').innerHTML=saved.length?saved.map(id=>`<button class="desk-item" data-open="${id}"><strong>${esc(BYID[id].name)} ↗</strong><span>${esc(sectionNames[BYID[id].section])}</span></button>`).join(''):'<p class="small-copy">尚未收藏。打开感兴趣的档案，点击“收藏”。</p>';
 document.getElementById('recent-entries').innerHTML=recent.length?recent.map(x=>`<button class="desk-item" data-resume="${esc(readingRoute(x))}"><strong>${esc(BYID[x.id].name)} ↗</strong><span>${x.mode==='art'?'插画 '+(x.variant+1)+' / '+(1+(GALLERY_DATA[x.id]?.length||0)):'知识档案'} · ${esc(new Date(x.time).toLocaleDateString('zh-CN'))}</span></button>`).join(''):'<p class="small-copy">打开档案或插画，阅读位置会自动保留。</p>';
 const last=recent[0];
 document.getElementById('resume-reading').innerHTML=last?`<div class="resume-card"><div><small>继续上次阅读</small><p>${esc(BYID[last.id].name)}${last.mode==='art'?' · 第 '+(last.variant+1)+' 幅插画':''}</p></div><button class="primary" data-resume="${esc(readingRoute(last))}">继续阅读 →</button></div>`:'';
 document.getElementById('clear-reading').disabled=!recent.length;
 document.querySelectorAll('[data-save]').forEach(b=>{const on=saved.includes(b.dataset.save);b.setAttribute('aria-pressed',on);b.setAttribute('aria-label',(on?'取消收藏':'收藏')+BYID[b.dataset.save].name);b.textContent=b.classList.contains('save-entry')?(on?'★':'☆'):(on?'★ 已收藏':'☆ 收藏')});
}
function toggleSaved(id){if(!BYID[id])return;const on=readingState.saved.includes(id);readingState.saved=on?readingState.saved.filter(x=>x!==id):[...readingState.saved,id];persistReading();announce(on?'已取消收藏':'已加入我的收藏')}
function entryTools(id){return `<div class="entry-tools"><button class="plain" data-save="${id}" aria-pressed="false">☆ 收藏</button><button class="plain" data-share="${id}">复制直达链接 ↗</button></div>`}
function linksFor(id){return RELATIONS.filter(r=>r.a===id||r.b===id).map(r=>({...r,id:r.a===id?r.b:r.a}))}
function historyFlow(id){
 const x=BYID[id],f=HISTORY_FLOW[id];if(!f)return '';
 return `<section class="history-chain" aria-labelledby="history-chain-title"><span class="eyebrow">CAUSE / EVENT / CONSEQUENCE</span><h4 id="history-chain-title">追踪前因与后果</h4><p class="small-copy">被遗忘的国度 · ${esc(x.date)}${id==='modern'?' · 出版物的故事窗口，不是统一“现今”':''}</p><div class="history-chain-grid">${[['01 / 前因',f.cause],['02 / 事件',f.event],['03 / 后果',f.effect]].map(([a,b])=>`<div class="history-step"><small>${a}</small><p>${esc(b)}</p></div>`).join('')}</div>${refHtml(f)}</section>`;
}
function knowledgeLinks(id){
 const links=linksFor(id);if(!links.length)return '';
 return `<section class="knowledge-links" aria-labelledby="knowledge-links-title"><span class="eyebrow">FOLLOW THE THREAD</span><h4 id="knowledge-links-title">沿着线索，继续阅读</h4><p class="small-copy">编者依据来源整理的关联。主题阅读与年表先后不代表具体剧情或直接因果；每条线索的范围与依据列在下方。</p><div class="relation-diagram" aria-label="${esc(BYID[id].name)}的关联入口"><div class="relation-center">${esc(BYID[id].name)}</div><div class="relation-branches">${links.slice(0,4).map(r=>`<button class="relation-node" data-open="${r.id}"><small>${esc(r.label)}</small><strong>${esc(BYID[r.id].name)} ↗</strong></button>`).join('')}</div></div><div class="relation-list">${links.map(r=>`<div class="relation-row"><span class="relation-label">${esc(r.label)}</span><button data-open="${r.id}">${esc(BYID[r.id].name)} ↗</button><p>${esc(r.note)}</p>${refHtml(r)}</div>`).join('')}</div></section>`;
}
function setEntryRoute(id,mode='entry',variant=0){
 const hash='#'+(mode==='art'?'art/'+id+'/'+variant:'entry/'+id);
 if(location.hash!==hash)history.pushState(null,'',hash);
 document.title=BYID[id].name+' · D&D 世界百科';
}
function applyRoute(){
 const hash=location.hash.slice(1),parts=hash.split('/');
 if((parts[0]==='entry'||parts[0]==='art')&&BYID[parts[1]]){
  const id=parts[1];document.title=BYID[id].name+' · D&D 世界百科';showSection(BYID[id].section,false);
  searchDialog.close();document.getElementById('share-dialog').close();
  if(parts[0]==='entry'){artDialog.close();openEntry(id,false)}
  else if(document.getElementById('art-'+id)){entryDialog.close();openArt(id,Number(parts[2])||0,false);history.replaceState(null,'','#art/'+id+'/'+currentArtVariant)}
  else{history.replaceState(null,'','#entry/'+id);artDialog.close();openEntry(id,false)}
 }else{
  artDialog.close();entryDialog.close();searchDialog.close();document.getElementById('share-dialog').close();
  const section=sectionNames[hash]?hash:'overview';showSection(section,false);document.title='D&D 世界百科 · 多元宇宙知识图谱';
  if(hash&&!sectionNames[hash]&&hash!=='main'){history.replaceState(null,'','#overview');announce('没有找到这个入口，已回到阅览目录。')}
 }
}
window.addEventListener('hashchange',applyRoute);window.addEventListener('popstate',applyRoute);
entryDialog.addEventListener('close',()=>{if(location.hash.startsWith('#entry/')&&!artDialog.open){history.replaceState(null,'','#'+activeSection);document.title='D&D 世界百科 · 多元宇宙知识图谱'}});
artDialog.addEventListener('close',()=>{if(location.hash.startsWith('#art/')){const id=entryDialog.dataset.entry;history.replaceState(null,'',entryDialog.open&&BYID[id]?'#entry/'+id:'#'+activeSection);document.title=entryDialog.open?BYID[id].name+' · D&D 世界百科':'D&D 世界百科 · 多元宇宙知识图谱'}});
async function shareEntry(id){
 const hash=artDialog.open&&currentArt===id?'#art/'+id+'/'+currentArtVariant:'#entry/'+id;
 const url=new URL(location.href);url.hash=hash;
 try{await navigator.clipboard.writeText(url.href);announce('直达链接已复制')}
 catch{const dialog=document.getElementById('share-dialog'),field=document.getElementById('share-url');field.value=url.href;dialog.showModal();field.focus();field.select()}
}
document.addEventListener('click',e=>{
 const save=e.target.closest('[data-save]');if(save)toggleSaved(save.dataset.save);
 const share=e.target.closest('[data-share]');if(share)shareEntry(share.dataset.share);
 const resume=e.target.closest('[data-resume]');if(resume){if(location.hash!==resume.dataset.resume)history.pushState(null,'',resume.dataset.resume);applyRoute()}
 const map=e.target.closest('[data-map]');if(map)selectMapLocation(map.dataset.map);
});
document.getElementById('clear-reading').addEventListener('click',()=>{readingState.recent=[];persistReading();announce('阅读记录已清空，收藏已保留')});
function selectMapLocation(id){
 const x=BYID[id],img=document.getElementById('art-'+id);if(!x||x.section!=='atlas'||!img)return;
 document.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.map===id));
 const linked=linksFor(id).filter(r=>['people','atlas'].includes(BYID[r.id].section));
 document.getElementById('map-preview').innerHTML=`<figure><button class="art-open" data-art="${id}" aria-label="查看${esc(x.name)}概念插画"><img src="${img.src}" ${img.dataset.srcset?`srcset="${esc(img.dataset.srcset)}" sizes="(max-width:620px) 90vw, 480px"`:''} width="1536" height="1024" alt="${esc(img.alt)}" decoding="async"></button><figcaption class="small-copy">AI 概念插画 · 艺术演绎</figcaption></figure><h4>${esc(x.name)}</h4><div class="en">${esc(x.en)}</div><p>${esc(x.body)}</p><span class="eyebrow">人物与势力 · 阅读关联</span><div class="map-related">${linked.length?linked.map(r=>`<button class="plain" data-open="${r.id}">${esc(BYID[r.id].name)} ↗</button>`).join(''):'<span class="small-copy">暂未收录独立人物或势力关联；可在档案中阅读地点背景。</span>'}</div><button class="primary" data-open="${id}">打开地点档案 ↗</button>${refHtml(x)}`;
}
renderReading();selectMapLocation('waterdeep');applyRoute();
