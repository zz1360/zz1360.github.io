(()=>{'use strict';
const root=document.querySelector('#scene'),vehicle=document.querySelector('#vehicle'),picture=document.querySelector('#vehicle-image'),wheels=[document.querySelector('#wheel-1'),document.querySelector('#wheel-2')],next=document.querySelector('#next'),toggle=document.querySelector('#motion'),speedInput=document.querySelector('#speed'),speedValue=document.querySelector('#speed-value'),sign=document.querySelector('.station-sign'),routeDialog=document.querySelector('.route-dialog'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
const models=[{src:'/assets/forest-station/red-layered.png',w:1774,h:887,r:137,centers:[[390,651,132],[1412,653,133]],desktop:900,mobile:1405,bottom:.91},{src:'/assets/forest-station/blue-layered.png',w:1944,h:809,r:135,centers:[[437,631,127],[1561,632,128]],desktop:1050,mobile:1500,bottom:.97},{src:'/assets/forest-station/bus-layered.png',w:2172,h:724,r:116,centers:[[569,604,108],[1738,602,109]],desktop:1930,mobile:2690,bottom:.99}];models.forEach(m=>{const i=new Image();i.src=m.src});
let paused=reduce.matches,index=0,progress=.12,last=0,raf=0,rest=0,cover=1,adTimer=0,adIndex=0,pointer=null,suppressClick=false,wheelAt=0,hovering=false,screen='stations',speedFactor=1.6;const baseSpeed=120,wait=9,ads=['soda','post'];
function sync(){root.classList.toggle('paused',paused);toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'播放动画':'暂停动画';next.disabled=paused}
// Each wheel crop includes its tire; matching holes in the car image prevent duplicates.
function setupWheel(el,m,center){const [x,y,r]=center,d=r*2;el.style.width=(100*d/m.w)+'%';el.style.left=(100*(x-r)/m.w)+'%';el.style.top=(100*(y-r)/m.h)+'%';el.style.backgroundImage=`url("${m.src}")`;el.style.backgroundSize=(100*m.w/d)+'% auto';el.style.backgroundPosition=(100*(x-r)/(m.w-d))+'% '+(100*(y-r)/(m.h-d))+'%'}
function setVehicle(){const m=models[index];picture.src=m.src;picture.style.setProperty('--window-mask',`url("/assets/forest-station/window-${['red','blue','bus'][index]}.svg")`);vehicle.classList.toggle('bus',index===2);wheels.forEach((el,i)=>setupWheel(el,m,m.centers[i]));sizeVehicle();updateWheelSpeed()}
function sizeVehicle(){const mobile=root.clientWidth<=800,m=models[index],width=(mobile?m.mobile:m.desktop)*cover,height=width*m.h/m.w,h=root.clientHeight,top=(h-(mobile?1672:941)*cover)/2,roadY=top+(mobile?1605:908)*cover,bottom=h-roadY-(1-m.bottom)*height;vehicle.style.setProperty('--vehicle-width',width+'px');vehicle.style.setProperty('--vehicle-bottom',bottom+'px');vehicle.style.setProperty('--wheel-period',(Math.PI*2*(m.r*width/m.w)/baseSpeed)+'s')}
function updateWheelSpeed(){wheels.forEach(el=>el.getAnimations().forEach(animation=>animation.updatePlaybackRate(speedFactor)))}
function draw(){const width=vehicle.offsetWidth,distance=root.clientWidth+width*1.3,x=-width*1.15+distance*progress;vehicle.style.transform=`translate3d(${x}px,0,0)`}
function step(t){raf=0;if(paused||document.hidden)return;const delta=last?Math.min((t-last)/1000,.05):0;last=t;if(progress<1){const distance=root.clientWidth+vehicle.offsetWidth*1.3;progress=Math.min(1,progress+delta*baseSpeed*speedFactor/distance);draw()}else{rest+=delta;if(rest>=wait){rest=0;index=(index+1)%models.length;setVehicle();progress=0;draw()}}raf=requestAnimationFrame(step)}
function wake(){last=0;if(!raf&&!paused&&!document.hidden)raf=requestAnimationFrame(step)}
function cancelAd(){clearTimeout(adTimer);adTimer=0}
const pages=['stations','soda','post'];
function scheduleAd(delay=9000){cancelAd();if(paused||document.hidden||hovering||pointer||routeDialog.open||sign.contains(document.activeElement))return;adTimer=setTimeout(()=>{if(screen==='stations'){showScreen(ads[adIndex]);adIndex=(adIndex+1)%ads.length;scheduleAd(6000)}else{showScreen('stations');scheduleAd(9000)}},delay)}
function showScreen(name){screen=name;sign.dataset.active=name;sign.querySelectorAll('[data-screen]').forEach(el=>el.hidden=el.dataset.screen!==name);sign.querySelectorAll('[data-page]').forEach(el=>{if(el.dataset.page===name)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current')})}
function goTo(name){showScreen(name);scheduleAd(12000)}
function moveScreen(direction){const current=pages.indexOf(screen);goTo(pages[(current+direction+pages.length)%pages.length])}
function backToStations(){goTo('stations')}
toggle.addEventListener('click',()=>{paused=!paused;sync();if(paused){cancelAd();if(raf){cancelAnimationFrame(raf);raf=0}}else{scheduleAd();wake()}});next.addEventListener('click',()=>{if(paused)return;index=(index+1)%models.length;setVehicle();progress=0;rest=0;draw();wake()});
speedInput.addEventListener('input',()=>{speedFactor=Number(speedInput.value);speedValue.textContent=speedFactor.toFixed(1)+'×';speedInput.setAttribute('aria-valuetext',speedFactor.toFixed(1)+' 倍');updateWheelSpeed()});
sign.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hovering=true;cancelAd()}});
sign.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){hovering=false;scheduleAd(12000)}});
sign.addEventListener('dragstart',e=>e.preventDefault());
sign.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.closest('.sign-nav'))return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dragging:false};cancelAd()});
sign.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(!pointer.dragging&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)){pointer.dragging=true;if(sign.setPointerCapture)sign.setPointerCapture(e.pointerId)}});
sign.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,wasDrag=pointer.dragging;pointer=null;if(wasDrag){suppressClick=true;setTimeout(()=>{suppressClick=false},0);if(Math.abs(dx)>32&&Math.abs(dx)>Math.abs(dy))moveScreen(dx<0?1:-1);else scheduleAd(12000)}else scheduleAd(12000)});
sign.addEventListener('pointercancel',()=>{pointer=null;scheduleAd(12000)});
sign.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation()}},true);
sign.addEventListener('wheel',e=>{e.preventDefault();const now=Date.now(),delta=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(delta)>3&&now-wheelAt>450){wheelAt=now;moveScreen(delta>0?1:-1)}},{passive:false});
sign.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();moveScreen(e.key==='ArrowRight'?1:-1)}});
sign.querySelector('.sign-prev').addEventListener('click',()=>moveScreen(-1));
sign.querySelector('.sign-next').addEventListener('click',()=>moveScreen(1));
sign.querySelector('.map-trigger').addEventListener('click',()=>{cancelAd();routeDialog.showModal()});
routeDialog.querySelector('.route-close').addEventListener('click',()=>routeDialog.close());
routeDialog.addEventListener('close',()=>scheduleAd(12000));
sign.querySelectorAll('.fictional-ad').forEach(el=>el.addEventListener('click',backToStations));
sign.addEventListener('focusin',cancelAd);sign.addEventListener('focusout',()=>setTimeout(()=>{if(!sign.contains(document.activeElement))scheduleAd(12000)},0));
reduce.addEventListener('change',()=>{paused=reduce.matches;sync();if(paused){cancelAd();if(raf){cancelAnimationFrame(raf);raf=0}}else{scheduleAd();wake()}});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAd();if(raf)cancelAnimationFrame(raf);raf=0;last=0}else{scheduleAd();wake()}});
function positionSign(){const w=root.clientWidth,h=root.clientHeight,mobile=w<=800,sw=mobile?941:1672,sh=mobile?1672:941;cover=Math.max(w/sw,h/sh);const left=(w-sw*cover)/2,top=(h-sh*cover)/2,x=mobile?633:840,y=mobile?868:477;sign.style.setProperty('--sign-x',String((left+x*cover)/w*100));sign.style.setProperty('--sign-y',String((top+y*cover)/h*100));sign.style.setProperty('--sign-w',((mobile?300:250)*cover)+'px');sign.style.setProperty('--sign-h',((mobile?435:320)*cover)+'px');sizeVehicle()}
window.addEventListener('resize',()=>{positionSign();draw()},{passive:true});sync();positionSign();setVehicle();draw();scheduleAd();wake();
})();
