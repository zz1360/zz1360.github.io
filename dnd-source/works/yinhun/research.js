// Research never changes spoiler settings, and uses the novel's existing preference.
const researchTopics=$$('#research [data-research-id]');
function researchFilter(){
 const query=$('#research-query').value.trim().toLocaleLowerCase();let count=0;
 researchTopics.forEach(topic=>{
  const match=!query||topic.textContent.toLocaleLowerCase().includes(query);
  topic.hidden=!match;if(match)count++;else topic.open=false;
 });
 $('#research-count').textContent=count+' 个主题';$('#research-empty').hidden=count!==0;
}
function researchOpen(id,changeRoute=false){
 const topic=researchTopics.find(n=>n.dataset.researchId===id);if(!topic)return;
 if(!readerFull()){
  $('#research-status').textContent='该主题包含跨卷分析，请先在阅读设置中选择“允许完整剧透”。';
  $('#research-locked').scrollIntoView({block:'center'});return;
 }
 $('#research-query').value='';researchFilter();topic.open=true;
 topic.scrollIntoView({block:'start'});
 if(changeRoute&&location.hash!=='#research/'+id)history.pushState(null,'','#research/'+id);
 readerRemember('section','research');
}
function researchApply(){
 const full=readerFull();$('#research-full-link').hidden=!full;$('#research-complete').hidden=!full;$('#research-locked').hidden=full;
 $('#research-status').textContent='';$('#research-query').value='';
 researchTopics.forEach(topic=>{topic.open=false;topic.hidden=false});researchFilter();
 if(full&&location.hash.startsWith('#research/'))researchOpen(location.hash.split('/')[1]);
}
$('#research-query').addEventListener('input',researchFilter);
document.addEventListener('click',event=>{
 const topic=event.target.closest('[data-research-topic]');if(topic){event.preventDefault();researchOpen(topic.dataset.researchTopic,true)}
 if(event.target.closest('[data-research-clear]')){$('#research-query').value='';researchFilter();$('#research-query').focus()}
 if(event.target.closest('[data-research-settings]')){$('#reading').scrollIntoView({block:'start'});$('#reader-mode').focus({preventScroll:true})}
});

let researchPrintState=[];
window.addEventListener('beforeprint',()=>{
 researchPrintState=researchTopics.map(topic=>[topic,topic.open]);
 if(readerFull())researchTopics.filter(topic=>!topic.hidden).forEach(topic=>topic.open=true);
});
window.addEventListener('afterprint',()=>{
 researchPrintState.forEach(([topic,open])=>topic.open=open);researchPrintState=[];
});
