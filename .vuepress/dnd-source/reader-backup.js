/* Shared, local-only backup for the codex and novel. No supplied URLs or markup are used. */
(() => {
 const index=JSON.parse(document.getElementById('reader-index-data').textContent), coreKey='dnd-codex-reading-v1',workKey='dnd-work-yinhun-reading-v1';
 const ids=new Set(index.core),characters=new Set(index.characters),events=new Set(index.events);
 const route=x=>x&&((x.kind==='volume'&&Number.isInteger(x.id)&&x.id>=1&&x.id<=14)||(x.kind==='event'&&events.has(x.id))||(x.kind==='character'&&characters.has(x.id))||(x.kind==='section'&&['world','history','volumes','events','characters','relations','boundaries'].includes(x.id)));
 function work(x={}){
  if(!x||typeof x!=='object'||Array.isArray(x))throw Error('作品记录格式不正确');
  return {mode:['intro','progress','full'].includes(x.mode)?x.mode:'intro',volume:Number.isInteger(x.volume)&&x.volume>=1&&x.volume<=14?x.volume:1,book:!!x.book,saved:[...new Set((Array.isArray(x.saved)?x.saved:[]).filter(k=>typeof k==='string'&&(k.startsWith('character:')&&characters.has(k.slice(10))||k.startsWith('event:')&&events.has(k.slice(6))||/^volume:(?:[1-9]|1[0-4])$/.test(k))))].slice(0,92),last:route(x.last)?{kind:x.last.kind,id:x.last.id,variant:Number.isInteger(x.last.variant)?Math.max(0,Math.min(3,x.last.variant)):0}:null};
 }
 function core(x={}){if(!x||typeof x!=='object'||Array.isArray(x))throw Error('百科记录格式不正确');return {saved:[...new Set((Array.isArray(x.saved)?x.saved:[]).filter(id=>ids.has(id)))],recent:(Array.isArray(x.recent)?x.recent:[]).filter(v=>v&&ids.has(v.id)&&Number.isFinite(v.time)).slice(0,10).map(v=>({id:v.id,time:v.time,mode:v.mode==='art'?'art':'entry',variant:Number.isInteger(v.variant)?Math.max(0,Math.min(3,v.variant)):0}))};}
 const read=key=>{try{const x=JSON.parse(localStorage.getItem(key)||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch{return {}}};
 window.DndReadingBackup={work,core,read,workKey,coreKey};
 document.querySelectorAll('[data-reader-export]').forEach(b=>b.onclick=()=>{
  try{const payload={format:'dnd-reading-backup',version:1,codex:core(window.DndReadingBackup.currentCore?.()||read(coreKey)),yinhun:work(window.DndReadingBackup.currentWork?.()||read(workKey))};const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='DND阅读记录.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('已导出当前可读取的阅读进度与收藏。')}catch{status('无法读取本地保存的数据。')}
 });
 document.querySelectorAll('[data-reader-import]').forEach(b=>b.onclick=()=>document.getElementById('reader-import-file').click());
 document.getElementById('reader-import-file').onchange=async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  try{
   if(file.size>200000)throw Error('备份文件过大');const data=JSON.parse(await file.text());if(!data||data.format!=='dnd-reading-backup'||data.version!==1||!data.codex||!data.yinhun)throw Error('不是支持的 DND 阅读备份');
   const incomingCore=core(data.codex),incomingWork=work(data.yinhun),oldCore=core(read(coreKey)),oldWork=work(read(workKey));
   const mergedCore=core({saved:[...oldCore.saved,...incomingCore.saved],recent:[...incomingCore.recent,...oldCore.recent].sort((a,b)=>b.time-a.time).filter((v,i,a)=>a.findIndex(z=>z.id===v.id)===i)});
   // Import never unlocks spoilers or changes the current reading limit.
   const mergedWork=work({...oldWork,book:oldWork.book||incomingWork.book,saved:[...oldWork.saved,...incomingWork.saved],last:oldWork.last||incomingWork.last});
   const oldA=localStorage.getItem(coreKey),oldB=localStorage.getItem(workKey);
   try{localStorage.setItem(coreKey,JSON.stringify(mergedCore));localStorage.setItem(workKey,JSON.stringify(mergedWork))}catch(err){try{oldA===null?localStorage.removeItem(coreKey):localStorage.setItem(coreKey,oldA);oldB===null?localStorage.removeItem(workKey):localStorage.setItem(workKey,oldB)}catch{}throw err}
   window.dispatchEvent(new Event('dnd-reading-imported'));status('已合并收藏和阅读位置；当前剧透设置保持不变。');
  }catch(err){status('导入失败：'+(err.name==='SyntaxError'?'文件不是有效 JSON':err.message||'浏览器不允许保存'))}
 };
 function status(text){document.querySelectorAll('[data-reader-backup-status]').forEach(n=>n.textContent=text)}
})();
