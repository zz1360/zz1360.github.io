const LORE=JSON.parse(document.getElementById('novel-lore-data').textContent);
let readerState=DndReadingBackup.work(DndReadingBackup.read(DndReadingBackup.workKey)),readerBooting=true,readerStorage=true;
try{const key=DndReadingBackup.workKey+'-probe';localStorage.setItem(key,'1');localStorage.removeItem(key)}catch{readerStorage=false}
const readerOriginal={volumes:$$('.volume-panel').map(n=>n.innerHTML),cards:$$('.cast-card').map(n=>n.innerHTML),events:$$('.event-card').map(n=>n.innerHTML)};
const safeName=c=>c.id==='mei-fei-si'?'梅菲斯':c.name;
function readerFull(){return readerState.mode==='full'}
function readerLimit(){return readerFull()?14:readerState.mode==='progress'?readerState.volume:0}
function readerCitations(list){return (list||[]).filter(c=>DATA.sources[c.index]?.volume<=readerLimit())}
function readerKnown(c){const name=safeName(c).split('·')[0];return readerFull()||DATA.events.some(e=>e.volume<=readerLimit()&&e.characters.some(n=>n===name||name.startsWith(n)||n.startsWith(name)))}
function readerCharacter(c){
 if(!c||!readerKnown(c))return null;if(readerFull())return c;
 const name=safeName(c).split('·')[0],events=DATA.events.filter(e=>e.volume<=readerLimit()&&e.characters.some(n=>n===name||name.startsWith(n)||n.startsWith(name)));
 return {...c,name:safeName(c),subtitle:'已读卷内的人物记录',faction:'小说人物',traits:[],story:'当前仅展示已读卷内的行动。完整身世、人物评价和关系将在允许完整剧透时显示。',arc:events.map(e=>'第'+e.volume+'卷 · '+e.title),citations:readerCitations(events.flatMap(e=>e.citations)).map(c=>({...c,note:'核对已读卷内的人物行动。'}))};
}
function readerNotice(text){$('#reader-status').textContent=text}
function readerPersist(){try{localStorage.setItem(DndReadingBackup.workKey,JSON.stringify(readerState));readerStorage=true}catch{readerStorage=false}readerDesk()}
function readerRemember(kind,id,variant=0){if(readerBooting)return;readerState.last={kind,id,variant};readerPersist()}
function readerTools(kind,id){return `<button class="btn reader-save" data-reader-save="${esc(kind+':'+id)}" aria-pressed="false">☆ 收藏</button>`}
