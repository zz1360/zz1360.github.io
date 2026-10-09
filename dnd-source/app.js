'use strict';
const DATA=JSON.parse(document.getElementById('codex-data').textContent);
const WORKS=JSON.parse(document.getElementById('works-data')?.textContent||'[]');
const ALL=[...DATA.worlds,...DATA.planes,...DATA.history,...DATA.people,...DATA.locations,...DATA.factions,...DATA.terms];
const BYID=Object.assign(Object.create(null),Object.fromEntries(ALL.map(x=>[x.id,x])));
const sectionNames={overview:'阅览入口',worlds:'世界图谱',cosmos:'位面宇宙',history:'历史年表',people:'人物与神祇',atlas:'地理与势力',primer:'术语与入门',sources:'资料与边界',works:'衍生作品'};
const sourceNums=Object.fromEntries(Object.keys(DATA.sources).map((k,i)=>[k,String(i+1).padStart(2,'0')]));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const refHtml=x=>`<div class="sources-inline"><span>来源</span>${[...new Set(x.src)].map(k=>`<a href="${esc(DATA.sources[k].url)}" target="_blank" rel="noopener noreferrer">[${sourceNums[k]}] ${esc(DATA.sources[k].title)}</a>`).join('')}</div>`;
let activeSection='overview';
function showSection(id,scroll=true){
 if(!sectionNames[id])id='overview'; activeSection=id;
 document.querySelectorAll('.chapter').forEach(s=>s.hidden=s.id!==id);
 document.querySelectorAll('[data-section]').forEach(a=>{if(a.dataset.section===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
 document.getElementById('crumb').textContent=sectionNames[id];
 if(scroll)(document.body.classList.contains('stage-mode')?document.getElementById('main'):window).scrollTo({top:0,behavior:'instant'});
 window.dispatchEvent(new CustomEvent('chapterchange',{detail:id}));
}

document.addEventListener('click',e=>{
 const a=e.target.closest('a[href^="#"]');if(a&&sectionNames[a.hash.slice(1)]){const id=a.hash.slice(1);if(location.hash===a.hash){e.preventDefault();showSection(id)}}
 const art=e.target.closest('[data-art]');if(art)openArt(art.dataset.art);
 const open=e.target.closest('[data-open]');if(open)openEntry(open.dataset.open);
 const close=e.target.closest('[data-close]');if(close)document.getElementById(close.dataset.close).close();
 const plane=e.target.closest('[data-plane]');if(plane){selectPlane(plane.dataset.plane);if(plane.closest('#home-viz'))openEntry(plane.dataset.plane)}
});
showSection(location.hash.slice(1),false);
const entryDialog=document.getElementById('entry-dialog');
function openEntry(id,updateRoute=true){
 const x=BYID[id];if(!x)return;
 if(updateRoute)setEntryRoute(id);artDialog.close();entryDialog.dataset.entry=id;showSection(x.section,false);
 document.getElementById('entry-title').textContent=sectionNames[x.section]+' / 知识档案';
 document.getElementById('entry-content').innerHTML=`${entryTools(id)}${entryIllustration(id)}<span class="eyebrow">${esc(x.date||x.setting||x.tag||x.cat||x.kind||'D&D CODEX')}</span><h3 style="margin-top:14px">${esc(x.name)}</h3><div class="en">${esc(x.en)}</div><p>${esc(x.body)}</p>${x.details.map(([a,b])=>`<h4>${esc(a)}</h4><p>${esc(b)}</p>`).join('')}${refHtml(x)}${historyFlow(id)}${knowledgeLinks(id)}`;
 rememberEntry(id);renderReading();
 if(!entryDialog.open)entryDialog.showModal();entryDialog.scrollTop=0;
}
[entryDialog,document.getElementById('search-dialog')].forEach(d=>d.addEventListener('click',e=>{const r=d.getBoundingClientRect();if(e.target===d&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))d.close()}));
const searchDialog=document.getElementById('search-dialog'),searchInput=document.getElementById('search-input');
function launchSearch(){searchDialog.showModal();searchInput.focus()}
document.getElementById('launch-search').addEventListener('click',launchSearch);
document.addEventListener('keydown',e=>{if(document.getElementById('share-dialog')?.open)return;if(e.key==='Escape'&&!document.getElementById('art-dialog')?.open&&(entryDialog.open||searchDialog.open)){e.preventDefault();(entryDialog.open?entryDialog:searchDialog).close();return}if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();if(!searchDialog.open&&!entryDialog.open&&!document.getElementById('art-dialog')?.open)launchSearch()}});
searchInput.addEventListener('input',()=>{
 const q=searchInput.value.trim().toLocaleLowerCase();const results=document.getElementById('search-results');
 if(!q){results.innerHTML='';document.getElementById('search-status').textContent='输入关键词，检索全部知识条目。';return}
 const found=ALL.filter(x=>[x.name,x.en,x.id,...(x.aliases||[]),x.body,x.date||'',x.setting||'',...x.details.flat()].join(' ').toLocaleLowerCase().includes(q));
 const foundWorks=WORKS.filter(x=>[x.title,x.author,x.category,x.description,x.scope].join(' ').toLocaleLowerCase().includes(q));
 document.getElementById('search-status').textContent=`找到 ${found.length+foundWorks.length} 个相关条目${foundWorks.length?'（含 '+foundWorks.length+' 部衍生作品）':''}`;
 const workResults=foundWorks.map(x=>`<a class="search-result work-result" href="${esc(x.url)}"><small>衍生作品 · ${esc(x.category)}</small><strong>《${esc(x.title)}》</strong><small>${esc(x.author)}</small><p>${esc(x.description)}</p></a>`).join('');
 results.innerHTML=found.length+foundWorks.length?found.map(x=>`<button class="search-result" data-result="${x.id}"><small>${esc(sectionNames[x.section])}${x.date?' · '+esc(x.date):''}</small><strong>${esc(x.name)}</strong><small>${esc(x.en)}</small><p>${esc(x.body)}</p></button>`).join('')+workResults:'<p class="empty">没有找到相关条目。试试英文原名，或缩短关键词。</p>';
});
document.getElementById('search-results').addEventListener('click',e=>{const b=e.target.closest('[data-result]');if(b){searchDialog.close();openEntry(b.dataset.result)}});
function groupFilter(group,attr,list,container,count,noun){
 document.getElementById(group).addEventListener('click',e=>{
  const b=e.target.closest(`[data-${attr}]`);if(!b)return;const value=b.dataset[attr];
  document.querySelectorAll(`#${group} [data-${attr}]`).forEach(x=>{const on=x===b;x.classList.toggle('active',on);x.setAttribute('aria-pressed',on)});
  let n=0;document.querySelectorAll(`#${container} [data-entry]`).forEach(el=>{const x=BYID[el.dataset.entry],key=attr==='world'?'kind':'era';el.hidden=value!=='all'&&x[key]!==value;if(!el.hidden)n++});
  document.getElementById(count).textContent=`${n} ${noun}`;
 });
}
groupFilter('world-filters','world',DATA.worlds,'world-grid','world-count','个入口');
groupFilter('history-filters','era',DATA.history,'timeline','history-count','个节点');
function filterPeople(){
 const w=document.getElementById('person-world').value,r=document.getElementById('person-role').value;let n=0;
 document.querySelectorAll('#people-grid [data-entry]').forEach(el=>{const x=BYID[el.dataset.entry];el.hidden=(w!=='all'&&x.setting!==w)||(r!=='all'&&x.role!==r);if(!el.hidden)n++});
 document.getElementById('people-count').textContent=`${n} 个档案`;document.getElementById('people-empty').hidden=n!==0;
}
document.getElementById('person-world').addEventListener('change',filterPeople);
document.getElementById('person-role').addEventListener('change',filterPeople);
document.getElementById('reset-people').addEventListener('click',()=>{document.getElementById('person-world').value='all';document.getElementById('person-role').value='all';filterPeople()});
let selectedPlane='material';
function selectPlane(id){
 const x=DATA.planes.find(x=>x.id===id);if(!x)return;selectedPlane=id;
 document.getElementById('plane-panel').innerHTML=`<span class="tag gold">${esc(x.cat)}</span><h3>${esc(x.name)}</h3><div class="en">${esc(x.en)}</div><p>${esc(x.body)}</p><p>${esc(x.details[0][1])}</p>${refHtml(x)}`;
 document.querySelectorAll('.plane-selector [data-plane]').forEach(b=>{const on=b.dataset.plane===id;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)});
 window.dispatchEvent(new CustomEvent('planeselect',{detail:id}));
}
selectPlane('material');
document.getElementById('theme-button').addEventListener('click',e=>{const light=document.body.classList.toggle('light');e.target.textContent=light?'深色':'浅色';e.target.setAttribute('aria-label',light?'切换到深色阅读模式':'切换到浅色阅读模式')});
let printDetails=[],printHidden=[];
window.addEventListener('beforeprint',()=>{printHidden=[...document.querySelectorAll('[data-entry]')].map(x=>[x,x.hidden]);printHidden.forEach(([x])=>x.hidden=false);printDetails=[...document.querySelectorAll('details')].map(x=>[x,x.open]);document.querySelectorAll('details').forEach(x=>x.open=true)});
window.addEventListener('afterprint',()=>{printDetails.forEach(([x,open])=>x.open=open);printHidden.forEach(([x,hidden])=>x.hidden=hidden);showSection(activeSection,false)});
document.getElementById('print-button').addEventListener('click',async e=>{
 const button=e.currentTarget,label=button.textContent;
 const images=[...document.querySelectorAll('img[src]')].map(img=>[img,img.loading]);
 button.disabled=true;button.textContent='准备中…';
 try{
  images.forEach(([img])=>img.loading='eager');
  await Promise.allSettled(images.map(([img])=>img.decode()));
  window.print();
 }finally{
  images.forEach(([img,loading])=>img.loading=loading);
  button.disabled=false;button.textContent=label;
 }
});

const artDialog=document.getElementById('art-dialog');
const GALLERY_DATA=JSON.parse(document.getElementById('art-gallery-data')?.textContent||'{}');
let currentArt=null,currentArtVariant=0;
const hasGallery=id=>Boolean(GALLERY_DATA[id]?.length);
function artVariants(id){
 const img=document.getElementById('art-'+id);
 return [{title:'原始插画',src:img.dataset.full||img.src,thumb:img.dataset.thumb||img.src,srcset:img.dataset.srcset||'',alt:img.alt,note:img.dataset.artNote||'AI 生成的概念插画。'},...(GALLERY_DATA[id]||[])];
}
function entryIllustration(id){
 const original=document.getElementById('art-'+id);if(!original)return '';
 const action=hasGallery(id)?`浏览 ${1+GALLERY_DATA[id].length} 幅人物画廊 ↗`:'查看大图 ↗';
 return `<figure class="dialog-plate"><button class="art-open" type="button" data-art="${esc(id)}" aria-label="${esc(action+' · '+BYID[id].name)}"><img src="${original.src}" ${original.dataset.srcset?`srcset="${esc(original.dataset.srcset)}" sizes="(max-width:620px) 90vw, 800px"`:""} alt="${esc(original.alt)}" decoding="async" width="1536" height="1024"><span class="art-enlarge">${action}</span></button><figcaption>AI 概念插画 · 艺术演绎</figcaption></figure>`;
}
function artSiblings(id){const x=BYID[id];return ALL.filter(y=>y.section===x.section&&document.getElementById('art-'+y.id))}
function openArt(id,variant=0,updateRoute=true){
 const img=document.getElementById('art-'+id),x=BYID[id];if(!artDialog||!img||!x)return;
 const gallery=hasGallery(id),items=artVariants(id);
 currentArtVariant=Math.max(0,Math.min(Number.isFinite(variant)?Math.trunc(variant):0,items.length-1));
 const selected=items[currentArtVariant];
 currentArt=id;if(updateRoute)setEntryRoute(id,'art',currentArtVariant);showSection(x.section,false);rememberEntry(id,'art',currentArtVariant);
 document.getElementById('art-tools').innerHTML=entryTools(id);renderReading();document.getElementById('art-title').textContent=x.name+' · '+x.en;
 artDialog.classList.toggle('has-gallery',gallery);
 document.getElementById('art-full').srcset=selected.srcset||'';document.getElementById('art-full').sizes='(max-width:620px) 100vw, 1100px';document.getElementById('art-full').src=selected.src;document.getElementById('art-full').alt=selected.alt;
 document.getElementById('art-caption').textContent=gallery?selected.note+' 不作为官方外貌或故事事件的证据。':x.body+' '+selected.note+' 不作为官方外貌或准确地理证据。';
 const line=document.getElementById('art-variant-line'),strip=document.getElementById('art-gallery-list');
 line.hidden=!gallery;strip.hidden=!gallery;
 document.getElementById('art-variant-title').textContent=selected.title;
 // Keep thumbnail focus when arrows select a new image within the same gallery.
 if(strip.dataset.character!==id){
  strip.innerHTML=gallery?items.map((item,i)=>`<button type="button" class="art-thumbnail" data-variant="${i}" aria-label="${esc(item.title)}" aria-pressed="false"><img src="${item.thumb||item.src}" alt="" width="1536" height="1024" decoding="async"><span>${esc(item.title)}</span></button>`).join(''):'';
  strip.dataset.character=id;
 }
 strip.querySelectorAll('[data-variant]').forEach(button=>button.setAttribute('aria-pressed',Number(button.dataset.variant)===currentArtVariant));
 const siblings=gallery?items:artSiblings(id),index=gallery?currentArtVariant:siblings.findIndex(y=>y.id===id);
 document.getElementById('art-counter').textContent=(index+1)+' / '+siblings.length;
 document.getElementById('art-prev').disabled=!gallery&&index===0;
 document.getElementById('art-next').disabled=!gallery&&index===siblings.length-1;
 if(!artDialog.open)artDialog.showModal();artDialog.scrollTop=0;
}
function advanceArt(direction){
 if(!currentArt)return;
 if(hasGallery(currentArt)){const count=artVariants(currentArt).length;openArt(currentArt,(currentArtVariant+direction+count)%count);return}
 const siblings=artSiblings(currentArt),index=siblings.findIndex(y=>y.id===currentArt),next=siblings[index+direction];if(next)openArt(next.id);
}
if(artDialog){
 document.getElementById('art-gallery-list').addEventListener('click',e=>{const button=e.target.closest('[data-variant]');if(button)openArt(currentArt,Number(button.dataset.variant))});
 document.getElementById('art-prev').addEventListener('click',()=>advanceArt(-1));
 document.getElementById('art-next').addEventListener('click',()=>advanceArt(1));
 document.getElementById('art-read').addEventListener('click',()=>{const id=currentArt;artDialog.close();openEntry(id)});
 artDialog.addEventListener('click',e=>{const r=artDialog.getBoundingClientRect();if(e.target===artDialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))artDialog.close()});
 document.addEventListener('keydown',e=>{if(document.getElementById('share-dialog')?.open||!artDialog.open)return;if(e.key==='Escape'){e.preventDefault();artDialog.close()}else if(e.key==='ArrowLeft'){e.preventDefault();advanceArt(-1)}else if(e.key==='ArrowRight'){e.preventDefault();advanceArt(1)}});
 const stage=artDialog.querySelector('.art-stage');let swipeStart=null;
 stage.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||!hasGallery(currentArt))return;swipeStart={x:e.clientX,y:e.clientY,id:e.pointerId};stage.setPointerCapture(e.pointerId)});
 stage.addEventListener('pointerup',e=>{if(!swipeStart||swipeStart.id!==e.pointerId)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)*1.2)advanceArt(dx<0?1:-1)});
 stage.addEventListener('pointercancel',()=>swipeStart=null);
}

document.querySelectorAll('[data-preview]').forEach(slot=>{
 const source=document.getElementById('art-'+slot.dataset.preview);if(!source)return;
 const image=document.createElement('img');image.src=source.src;image.srcset=source.dataset.srcset||'';image.sizes='(max-width:620px) 90vw, 400px';image.alt=source.alt;image.decoding='async';image.loading='lazy';image.width=1536;image.height=1024;slot.append(image);
});
