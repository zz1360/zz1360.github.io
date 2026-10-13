/* Ranked, accessible codex search. Routing and dialog launch remain in app.js. */
(() => {
 'use strict';
 const FILTERS=[['all','全部'],['people','人物'],['places','地点'],['history','历史'],['other','其他'],['works','作品']];
 const GROUPS=['准确名称','名称与别名','正文与关键词'];
 const clean=value=>typeof value==='string'||typeof value==='number'?String(value).replace(/\s+/gu,' ').trim():'';
 // Keep a mapping back to the original text: case folding / full-width letters
 // can change string length, so highlights must not use normalized offsets.
 function field(value,label,kind){
  const text=clean(value),map=[];let folded='',offset=0;
  for(const character of text){
   const normalized=character.normalize('NFKC').toLowerCase();
   for(let i=0;i<normalized.length;i++)map.push([offset,offset+character.length]);
   folded+=normalized;offset+=character.length;
  }
  return {text,folded,map,label,kind};
 }
 const folded=value=>field(value,'','').folded;
 function node(tag,className,text){
  const element=document.createElement(tag);
  if(className)element.className=className;
  if(text!==undefined)element.textContent=text;
  return element;
 }
 function highlight(element,value,query){
  const source=typeof value==='string'?field(value,'',''):value;
  if(!query){element.textContent=source.text;return}
  let cursor=0,index=source.folded.indexOf(query);
  while(index!==-1){
   const start=source.map[index]?.[0],end=source.map[index+query.length-1]?.[1];
   if(start!==undefined&&end!==undefined&&start>=cursor){
    element.append(document.createTextNode(source.text.slice(cursor,start)),node('mark','',source.text.slice(start,end)));
    cursor=end;
   }
   index=source.folded.indexOf(query,index+query.length);
  }
  element.append(document.createTextNode(source.text.slice(cursor)));
 }
 function excerpt(source,query){
  const position=source.folded.indexOf(query);
  if(position<0)return source.text;
  const hitStart=source.map[position][0],hitEnd=source.map[position+query.length-1][1];
  let start=Math.max(0,hitStart-34),end=Math.min(source.text.length,Math.max(start+138,hitEnd+34));
  // Never split a surrogate pair at a snippet boundary.
  if(start&&/[\uDC00-\uDFFF]/u.test(source.text[start]))start--;
  if(end<source.text.length&&/[\uDC00-\uDFFF]/u.test(source.text[end]))end++;
  return (start?'…':'')+source.text.slice(start,end)+(end<source.text.length?'…':'');
 }
 function safeHref(value){
  const raw=typeof value==='string'?value.trim():'';
  if(!raw||/[\u0000-\u001F\u007F]/u.test(raw))return '';
  try{
   const url=new URL(raw,document.baseURI);
   if(url.protocol==='http:'||url.protocol==='https:')return raw;
   // Relative work links also remain usable in an offline export.
   if(url.protocol==='file:'&&!/^[a-z][a-z\d+.-]*:/iu.test(raw))return raw;
  }catch{}
  return '';
 }
 function category(item){
  if(item.section==='people')return 'people';
  if(item.section==='history')return 'history';
  if(item.kind==='地点'||item.section==='locations')return 'places';
  return 'other';
 }
 function entryRecord(item,index){
  const fields=[field(item.name,'名称','name'),field(item.en,'英文原名','name')];
  (Array.isArray(item.aliases)?item.aliases:[]).forEach(alias=>fields.push(field(alias,'别名','alias')));
  fields.push(field(item.id,'条目编号','alias'),field(item.body,'正文','content'));
  (Array.isArray(item.details)?item.details:[]).forEach(detail=>{
   const values=Array.isArray(detail)?detail.flat(Infinity).map(clean).filter(Boolean):[clean(detail)];
   fields.push(field(values.join('：'),'详细档案','content'));
  });
  [['date','时间'],['setting','所属设定'],['tag','标签'],['cat','分类'],['kind','类别'],['era','时代'],['role','角色']].forEach(([key,label])=>fields.push(field(item[key],label,'content')));
  return {item,index,fields:fields.filter(x=>x.text),category:category(item),work:false};
 }
 function workRecord(item,index){
  const fields=[field(item.title,'作品名称','name'),field(item.en,'英文原名','name')];
  (Array.isArray(item.aliases)?item.aliases:[]).forEach(alias=>fields.push(field(alias,'作品别名','alias')));
  fields.push(field(item.id,'作品编号','alias'));
  [['description','作品简介'],['scope','收录范围'],['author','作者'],['category','作品类别'],['tagline','作品引言'],['reading_note','阅读说明']].forEach(([key,label])=>fields.push(field(item[key],label,'content')));
  return {item,index,fields:fields.filter(x=>x.text),category:'works',work:true,href:safeHref(item.url)};
 }
 function match(record,query){
  const hits=[];
  record.fields.forEach((source,order)=>{
   const position=source.folded.indexOf(query);if(position<0)return;
   let rank=6;
   if(source.kind==='name')rank=source.folded===query?0:position===0?2:4;
   if(source.kind==='alias')rank=source.folded===query?1:position===0?3:5;
   hits.push({source,rank,position,order});
  });
  if(!hits.length)return null;
  hits.sort((a,b)=>a.rank-b.rank||a.order-b.order||a.position-b.position);
  const best=hits[0],snippet=hits.find(hit=>hit.source.kind==='content')||best;
  return {...record,rank:best.rank,position:best.position,fieldOrder:best.order,group:best.rank===0?0:best.rank<6?1:2,snippet:snippet.source};
 }
 window.initCodexSearch=function(options={}){
  const dialog=document.getElementById('search-dialog'),input=document.getElementById('search-input'),results=document.getElementById('search-results'),status=document.getElementById('search-status');
  if(!dialog||!input||!results||!status)throw new Error('Codex search dialog is incomplete.');
  // app.js owns launch / close / Ctrl+K. Calling this twice is harmless.
  if(dialog.codexSearch)return dialog.codexSearch;
  const names=options.sectionNames||{},records=[...(Array.isArray(options.items)?options.items:[]).map(entryRecord),...(Array.isArray(options.works)?options.works:[]).map((item,index)=>workRecord(item,index+(options.items?.length||0)))];
  const filters=node('div','search-filters');filters.id='search-filters';filters.setAttribute('role','group');filters.setAttribute('aria-label','搜索结果类别');
  const help=node('p','search-keyboard-help','↑ ↓ 选择结果 · Enter 打开');help.id='search-keyboard-help';
  status.before(filters);status.after(help);
  status.style.removeProperty('color');status.style.removeProperty('font-size');status.style.removeProperty('margin');
  status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  input.setAttribute('role','combobox');input.setAttribute('aria-autocomplete','list');input.setAttribute('aria-controls',results.id);input.setAttribute('aria-haspopup','listbox');input.setAttribute('aria-describedby',status.id+' '+help.id);
  results.setAttribute('role','listbox');results.setAttribute('aria-label','搜索结果，按相关度排序');
  document.getElementById('launch-search')?.setAttribute('aria-controls',dialog.id);
  const filterButtons=new Map();
  FILTERS.forEach(([key,label])=>{
   const button=node('button','search-filter');button.type='button';button.dataset.searchFilter=key;
   button.append(node('span','',label),node('span','search-filter-count','0'));filters.append(button);filterButtons.set(key,button);
  });
  let currentFilter='all',activeIndex=-1,visible=[],buttons=[],lastQuery=null,lastFilter=null,pendingScroll=null;
  const syncExpanded=()=>input.setAttribute('aria-expanded',String(dialog.open&&visible.length>0));
  function setActive(index,{scroll=false,focus=false}={}){
   activeIndex=buttons.length?Math.max(-1,Math.min(buttons.length-1,index)):-1;
   buttons.forEach((button,i)=>{const active=i===activeIndex;button.setAttribute('aria-selected',String(active));button.classList.toggle('is-active',active);button.tabIndex=active?0:-1});
   if(activeIndex>=0)input.setAttribute('aria-activedescendant',buttons[activeIndex].id);else input.removeAttribute('aria-activedescendant');
   const selected=buttons[activeIndex];
   if(selected&&focus)selected.focus({preventScroll:true});
   if(selected&&scroll){
    const box=results.getBoundingClientRect(),item=selected.getBoundingClientRect();
    if(item.top<box.top)results.scrollTop-=box.top-item.top+5;
    else if(item.bottom>box.bottom)results.scrollTop+=item.bottom-box.bottom+5;
   }
  }
  function row(record,index,query){
   const item=record.item,button=node(record.work&&record.href?'a':'button','search-result'+(record.work?' work-result':''));
   if(button.tagName==='BUTTON')button.type='button';else button.setAttribute('href',record.href);
   if(record.work&&!record.href){button.disabled=true;button.setAttribute('aria-disabled','true')}
   if(!record.work)button.dataset.result=String(item.id);
   button.id='codex-search-option-'+index;button.dataset.searchIndex=String(index);button.setAttribute('role','option');button.setAttribute('aria-posinset',String(index+1));button.setAttribute('aria-setsize',String(visible.length));
   const top=node('span','search-result-top'),label=FILTERS.find(([key])=>key===record.category)[1];
   top.append(node('span','search-result-kind',label));
   const metadata=record.work?['衍生作品',item.category,item.author]:[names[item.section]||'知识条目',item.date||item.setting||item.kind||item.cat];
   top.append(node('span','search-result-meta',metadata.map(clean).filter(Boolean).join(' · ')));button.append(top);
   const title=node('strong','search-result-title');
   if(record.work)title.append(document.createTextNode('《'));
   highlight(title,record.work?item.title:item.name,query);
   if(record.work)title.append(document.createTextNode('》'));
   button.append(title);
   if(clean(item.en)){const english=node('span','search-result-en');highlight(english,item.en,query);button.append(english)}
   const snippet=node('p','search-result-snippet');snippet.append(node('span','search-snippet-label',record.snippet.label+' · '));highlight(snippet,excerpt(record.snippet,query),query);button.append(snippet);
   if(record.work&&!record.href)button.append(node('span','search-result-unavailable','作品链接暂不可用'));
   return button;
  }
  function render(){
   const query=folded(input.value),changed=query!==lastQuery||currentFilter!==lastFilter;
   lastQuery=query;lastFilter=currentFilter;
   const found=query?records.map(record=>match(record,query)).filter(Boolean).sort((a,b)=>a.rank-b.rank||a.fieldOrder-b.fieldOrder||a.position-b.position||a.index-b.index):[];
   visible=currentFilter==='all'?found:found.filter(record=>record.category===currentFilter);
   FILTERS.forEach(([key,label])=>{
    const button=filterButtons.get(key),count=key==='all'?found.length:found.filter(record=>record.category===key).length;
    button.querySelector('.search-filter-count').textContent=String(count);button.setAttribute('aria-pressed',String(key===currentFilter));button.setAttribute('aria-label',label+'，'+count+' 个结果');
   });
   filters.hidden=!query;help.hidden=!visible.length;
   results.replaceChildren();buttons=[];
   if(!query){
    status.textContent='输入名称、英文原名或正文关键词。';
    const guide=node('div','search-guide');guide.append(node('strong','','从一个关键词开始'),node('p','','也可以搜索别名、年代或设定名称，例如“魔网”、“Netheril”。'));results.append(guide);
   }else if(!visible.length){
    const label=FILTERS.find(([key])=>key===currentFilter)[1];
    status.textContent=found.length?'共 '+found.length+' 个匹配；“'+label+'”类别没有结果。':'没有找到匹配“'+clean(input.value)+'”的条目。';
    const empty=node('div','search-empty');empty.append(node('strong','',found.length?'这个类别没有匹配条目':'暂未找到相关条目'),node('p','',found.length?'切换到“全部”，查看其他类别的匹配结果。':'试试英文原名、常见别名，或缩短关键词。'));
    if(found.length){const reset=node('button','search-empty-reset','查看全部 '+found.length+' 个结果');reset.type='button';reset.dataset.searchReset='';empty.append(reset)}
    results.append(empty);
   }else{
    status.textContent=currentFilter==='all'?'找到 '+found.length+' 个相关条目 · 名称命中优先':'共 '+found.length+' 个匹配 · 显示 '+visible.length+' 个'+FILTERS.find(([key])=>key===currentFilter)[1]+'条目';
    let group=null,container=null;
    visible.forEach((record,index)=>{
     if(record.group!==group){
      group=record.group;container=node('section','search-result-group');container.setAttribute('role','group');container.setAttribute('aria-label',GROUPS[group]);
      const count=visible.filter(result=>result.group===group).length,heading=node('div','search-group-heading',GROUPS[group]+' · '+count);heading.setAttribute('aria-hidden','true');container.append(heading);results.append(container);
     }
     const button=row(record,index,query);buttons.push(button);container.append(button);
    });
   }
   setActive(changed&&visible.length?0:activeIndex);syncExpanded();
   if(pendingScroll!==null){results.scrollTop=pendingScroll;if(dialog.open)pendingScroll=null}else if(changed)results.scrollTop=0;
  }
  function snapshot(){return {query:input.value,filter:currentFilter,scroll:pendingScroll??results.scrollTop,activeIndex}}
  function restore(state){
   if(!state||typeof state!=='object')return;
   input.value=typeof state.query==='string'?state.query:'';
   currentFilter=FILTERS.some(([key])=>key===state.filter)?state.filter:'all';
   // A snapshot is data only: restoring it never opens the dialog or routes.
   activeIndex=Number.isInteger(state.activeIndex)?state.activeIndex:-1;
   pendingScroll=Number.isFinite(state.scroll)?Math.max(0,state.scroll):0;
   lastQuery=folded(input.value);lastFilter=currentFilter;render();
   // render keeps pendingScroll when the dialog has no layout. Its open
   // observer applies that position after showModal(), in either call order.
  }
  function chooseFilter(key){
   if(!FILTERS.some(([filter])=>filter===key))return;
   currentFilter=key;render();
  }
  function activate(record){
   if(!record||record.work&&!record.href)return;
   if(typeof options.beforeOpen==='function')options.beforeOpen();
   if(dialog.open)dialog.close();
   if(!record.work&&typeof options.openEntry==='function')options.openEntry(record.item.id);
  }
  input.addEventListener('input',render);
  filters.addEventListener('click',event=>{const button=event.target.closest('[data-search-filter]');if(button&&filters.contains(button))chooseFilter(button.dataset.searchFilter)});
  results.addEventListener('click',event=>{
   if(event.target.closest('[data-search-reset]')){chooseFilter('all');input.focus({preventScroll:true});return}
   const button=event.target.closest('[data-search-index]');if(!button||!results.contains(button))return;
   const index=Number(button.dataset.searchIndex);setActive(index);
   const record=visible[index];if(!record)return;
   // Preserve native links, including Cmd/Ctrl-click to open a work in a tab.
   if(record.work&&(event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.button!==0))return;
   activate(record);
  });
  results.addEventListener('focusin',event=>{const button=event.target.closest('[data-search-index]');if(button)setActive(Number(button.dataset.searchIndex))});
  function keydown(event){
   if(event.isComposing||event.keyCode===229||event.altKey||event.ctrlKey||event.metaKey)return;
   const inInput=event.target===input,result=event.target.closest('[data-search-index]');
   if(!inInput&&!result||!visible.length)return;
   if(event.key==='ArrowDown'||event.key==='ArrowUp'){
    event.preventDefault();const direction=event.key==='ArrowDown'?1:-1;
    const next=activeIndex<0?(direction>0?0:buttons.length-1):Math.max(0,Math.min(buttons.length-1,activeIndex+direction));
    setActive(next,{scroll:true,focus:!inInput});
   }else if(!inInput&&(event.key==='Home'||event.key==='End')){
    event.preventDefault();setActive(event.key==='Home'?0:buttons.length-1,{scroll:true,focus:true});
   }else if(inInput&&event.key==='Enter'){
    event.preventDefault();buttons[activeIndex<0?0:activeIndex]?.click();
   }
  }
  input.addEventListener('keydown',keydown);results.addEventListener('keydown',keydown);
  dialog.addEventListener('close',syncExpanded);
  const observer=new MutationObserver(()=>{
   syncExpanded();
   if(dialog.open&&pendingScroll!==null){results.scrollTop=pendingScroll;pendingScroll=null}
  });observer.observe(dialog,{attributes:true,attributeFilter:['open']});
  const api={render,snapshot,restore};dialog.codexSearch=api;render();return api;
 };
})();
