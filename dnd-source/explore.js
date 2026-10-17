'use strict';
const RELATIONS=JSON.parse(document.getElementById('relations-data').textContent);
const HISTORY_FLOW=JSON.parse(document.getElementById('history-flow-data').textContent);
let noticeTimer;
function announce(message){
 const node=document.getElementById('codex-notice');clearTimeout(noticeTimer);
 const top=document.getElementById('share-dialog').open?document.getElementById('share-dialog'):artDialog.open?artDialog:entryDialog.open?entryDialog:document.body;
 top.append(node);node.textContent=message;node.hidden=false;
 noticeTimer=setTimeout(()=>{node.hidden=true;document.body.append(node)},2500);
}
function entryTools(id){return `<div class="entry-tools"><button class="plain" data-share="${id}">复制直达链接 ↗</button></div>`}
function linksFor(id){return RELATIONS.filter(r=>r.a===id||r.b===id).map(r=>({...r,id:r.a===id?r.b:r.a}))}
function historyFlow(id){
 const x=BYID[id],f=HISTORY_FLOW[id];if(!f)return '';
 return `<section class="history-chain" aria-label="事件脉络"><div class="history-chain-grid">${[['前因',f.cause],['经过',f.event],['影响',f.effect]].map(([a,b])=>`<div class="history-step"><small>${a}</small><p>${esc(b)}</p></div>`).join('')}</div></section>`;
}
function knowledgeLinks(id){
 const links=linksFor(id);if(!links.length)return '';
 return `<section class="knowledge-links" aria-labelledby="knowledge-links-title"><h4 id="knowledge-links-title">相关条目</h4><div class="relation-diagram" aria-label="${esc(BYID[id].name)}的关联入口"><div class="relation-center">${esc(BYID[id].name)}</div><div class="relation-branches">${links.slice(0,4).map(r=>`<button class="relation-node" data-open="${r.id}"><small>${esc(r.label)}</small><strong>${esc(BYID[r.id].name)} ↗</strong></button>`).join('')}</div></div><div class="relation-list">${links.map(r=>`<div class="relation-row"><span class="relation-label">${esc(r.label)}</span><button data-open="${r.id}">${esc(BYID[r.id].name)} ↗</button><p>${esc(r.note)}</p>${refHtml(r)}</div>`).join('')}</div></section>`;
}
function setEntryRoute(id,mode='entry',variant=0){
 const hash='#'+(mode==='art'?'art/'+id+'/'+variant:'entry/'+id);
 if(window.codexNavigation)window.codexNavigation.navigate(hash);else if(location.hash!==hash)history.pushState(null,'',hash);
 document.title=BYID[id].name+' · '+siteTitle;
}
function applyRoute(){
 const hash=location.hash.slice(1),parts=hash.split('/');
 if((parts[0]==='entry'||parts[0]==='art')&&BYID[parts[1]]){
  const id=parts[1];document.title=BYID[id].name+' · '+siteTitle;showSection(BYID[id].section,false);
  closeCodexDialog(searchDialog);closeCodexDialog(document.getElementById('share-dialog'));
  if(parts[0]==='entry'){closeCodexDialog(artDialog);openEntry(id,false)}
  else if(document.getElementById('art-'+id)){closeCodexDialog(entryDialog);openArt(id,Number(parts[2])||0,false);history.replaceState(history.state,'','#art/'+id+'/'+currentArtVariant)}
  else{history.replaceState(null,'','#entry/'+id);closeCodexDialog(artDialog);openEntry(id,false)}
 }else{
  closeCodexDialog(artDialog);closeCodexDialog(entryDialog);closeCodexDialog(searchDialog);closeCodexDialog(document.getElementById('share-dialog'));
  const section=sectionNames[hash]?hash:'overview';showSection(section,false);document.title=siteTitle;
  if(hash&&!sectionNames[hash]&&hash!=='main'){history.replaceState(null,'','#overview');announce('没有找到这个入口，已回到阅览目录。')}
 }
 window.codexNavigation?.restoreRoute();
}
window.addEventListener('hashchange',applyRoute);window.addEventListener('popstate',applyRoute);
entryDialog.addEventListener('close',()=>{if(window.codexNavigation?.consumeClose(entryDialog))return;if(location.hash.startsWith('#entry/')&&!artDialog.open)window.codexNavigation?.closedToSection()});
artDialog.addEventListener('close',()=>{if(window.codexNavigation?.consumeClose(artDialog))return;if(location.hash.startsWith('#art/'))window.codexNavigation?.closedArt()});
async function shareEntry(id){
 const hash=artDialog.open&&currentArt===id?'#art/'+id+'/'+currentArtVariant:'#entry/'+id;
 const url=new URL(location.href);url.hash=hash;
 try{await navigator.clipboard.writeText(url.href);announce('直达链接已复制')}
 catch{const dialog=document.getElementById('share-dialog'),field=document.getElementById('share-url');field.value=url.href;dialog.showModal();field.focus();field.select()}
}
document.addEventListener('click',e=>{
 const share=e.target.closest('[data-share]');if(share)shareEntry(share.dataset.share);
 const map=e.target.closest('[data-map]');if(map)selectMapLocation(map.dataset.map);
});
function selectMapLocation(id){
 const x=BYID[id],img=document.getElementById('art-'+id);if(!x||x.section!=='atlas'||!img)return;
 document.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.map===id));
 const linked=linksFor(id).filter(r=>['people','atlas'].includes(BYID[r.id].section));
 document.getElementById('map-preview').innerHTML=`<figure><button class="art-open" data-art="${id}" aria-label="查看${esc(x.name)}概念插画"><img src="${img.src}" ${img.dataset.srcset?`srcset="${esc(img.dataset.srcset)}" sizes="(max-width:620px) 90vw, 480px"`:''} width="1536" height="1024" alt="${esc(img.alt)}" decoding="async"></button><figcaption class="small-copy">AI 概念插画 · 艺术演绎</figcaption></figure><h4>${esc(x.name)}</h4><div class="en">${esc(x.en)}</div><p>${esc(x.body)}</p><div class="map-related">${linked.length?linked.map(r=>`<button class="plain" data-open="${r.id}">${esc(BYID[r.id].name)} ↗</button>`).join(''):''}</div><button class="primary" data-open="${id}">查看档案 ↗</button><details class="map-sources"><summary>资料来源</summary>${refHtml(x)}</details>`;
}
selectMapLocation('waterdeep');applyRoute();window.codexNavigation?.initialize();
