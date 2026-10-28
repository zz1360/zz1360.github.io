/* The astrolabe is a concept map, not a system of orbiting planets. */
(()=>{
 if(!window.THREE)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),views=[];
 function build(container,chapter){
  if(!container)return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch{container.querySelectorAll('.pause-viz,.reset-viz').forEach(b=>b.disabled=true);return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0,0);
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','位面星盘：拖动旋转，方向键调整视角，+ 和 - 缩放');
  container.prepend(renderer.domElement);container.querySelector('.fallback').hidden=true;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100),group=new THREE.Group();scene.add(group);
  scene.add(new THREE.AmbientLight(0xd4deff,2));const light=new THREE.PointLight(0xffdcab,55);light.position.set(-3,4,7);scene.add(light);
  const rim=new THREE.PointLight(0x819cff,28);rim.position.set(5,-2,4);scene.add(rim);
  const layer=container.querySelector('.label-layer'),nodes=[],byId=new Map();
  const graph=DATA.cosmology||{},center=graph.center||'material';
  const config=graph.config||[
   ['material',0,0,.4,.54],['feywild',-1.7,.1,.1,.26],['shadowfell',1.7,.1,.1,.26],
   ['ethereal',-3.1,1.65,-.3,.23],['astral',3.1,1.65,-.3,.25],
   ['elemental',-3,-1.65,-.2,.3],['outer',3,-1.65,-.2,.3],
   ['sigil',0,2.85,-.3,.28],['hells',1.65,-3,-.1,.24],['abyss',-1.65,-3,-.1,.25],['demiplane',0,-1.9,.1,.19]
  ];
  const mobileRows=graph.mobileRows||{sigil:[0,0],ethereal:[-1,1],astral:[1,1],feywild:[-1,2],shadowfell:[1,2],material:[0,3],elemental:[-1,4],outer:[1,4],abyss:[-1,5],hells:[1,5],demiplane:[0,6]};
  function ring(radius,color,opacity=.5){return new THREE.Mesh(new THREE.TorusGeometry(radius,.007,4,100),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}))}
  function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,.8)');g.addColorStop(.2,'rgba(255,255,255,.28)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
  const glowMap=glowTexture();
  config.forEach(([id,x,y,z,r])=>{
   const data=DATA.planes.find(p=>p.id===id),color=data.color;
   const material=new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.35,roughness:.3,metalness:.45,transparent:true,opacity:.85});
   const geometry=(graph.portalIds?graph.portalIds.includes(id):id==='sigil')?new THREE.TorusGeometry(r,.065,8,48):id==='abyss'?new THREE.OctahedronGeometry(r,0):new THREE.IcosahedronGeometry(r,id===center?1:0);
   const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.z=.3;mesh.userData.id=id;group.add(mesh);
   const facets=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0xffefce,transparent:true,opacity:id===center?.65:.38}));mesh.add(facets);
   const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color,transparent:true,opacity:.35,depthWrite:false}));halo.scale.setScalar(r*7);halo.position.copy(mesh.position);group.add(halo);
   const seal=ring(r*1.7,color,.55);seal.position.copy(mesh.position);seal.rotation.set(.5,.3,.1);group.add(seal);
   if(id===center){
    const second=ring(r*2.05,0xe5ca8e,.65);second.rotation.set(.6,-.5,.3);mesh.add(second);
    const orbit=ring(r*1.4,0xc2ddff,.45);orbit.rotation.set(-.8,.4,.5);mesh.add(orbit);
   }
   const label=document.createElement('button');label.type='button';label.className='node-label';label.textContent=data.name;label.dataset.plane=id;label.style.setProperty('--node-color',color);label.setAttribute('aria-label',(chapter==='overview'?'阅读':'选择')+data.name);label.setAttribute('aria-pressed','false');layer.append(label);
   const node={mesh,halo,ring:seal,label,r,base:[x,y,z]};nodes.push(node);byId.set(id,node);
  });
  const links=new THREE.Group();group.add(links);
  const connections=graph.connections||[['material','feywild'],['material','shadowfell'],['material','ethereal'],['material','astral'],['material','demiplane'],['ethereal','elemental'],['astral','outer'],['outer','sigil'],['outer','hells'],['outer','abyss']];
  function connect(){for(const line of [...links.children]){links.remove(line);line.geometry.dispose();line.material.dispose()}for(const [a,b] of connections){const start=byId.get(a).mesh.position,end=byId.get(b).mesh.position,mid=start.clone().lerp(end,.5);mid.z-=.5;const curve=new THREE.QuadraticBezierCurve3(start.clone(),mid,end.clone());links.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),new THREE.LineBasicMaterial({color:byId.get(b).mesh.material.color,transparent:true,opacity:.25})))}}
  // Broken engraved arcs frame the chart without suggesting literal orbits.
  const ornament=new THREE.Group();scene.add(ornament);
  const decorationMaterials=[];
  function decorationMaterial(opacity){const material=new THREE.LineBasicMaterial({color:0xd6b979,transparent:true,opacity,depthWrite:false});decorationMaterials.push({material,opacity});return material}
  function arc(radius,start,end,opacity){
   const points=[];for(let i=0;i<=48;i++){const a=start+(end-start)*i/48;points.push(new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius*.87,-1.6))}
   ornament.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),decorationMaterial(opacity)));
  }
  [[4.10,.30,.93,.27],[4.10,2.22,2.87,.27],[4.10,3.37,4.02,.25],[4.10,5.28,5.92,.25],
   [4.27,.46,.84,.13],[4.27,2.34,2.73,.13],[4.27,3.52,3.90,.13],[4.27,5.41,5.80,.13]].forEach(args=>arc(...args));
  const marks=[];for(const start of [.30,2.22,3.37,5.28])for(let i=0;i<13;i++){
   const a=start+.035+i*.047,r=4.10,inner=r-(i%4===0?.09:.045);
   marks.push(Math.cos(a)*inner,Math.sin(a)*inner*.87,-1.6,Math.cos(a)*r,Math.sin(a)*r*.87,-1.6);
  }
  ornament.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(marks,3)),decorationMaterial(.25)));
  // Four small diamonds echo the node facets; keep them behind the labels.
  const diamonds=[];for(const a of [1.22,1.92,4.36,4.90]){
   const x=Math.cos(a)*4.17,y=Math.sin(a)*4.17*.87,d=.045,z=-1.6;
   diamonds.push(x,y+d,z,x+d,y,z, x+d,y,z,x,y-d,z, x,y-d,z,x-d,y,z, x-d,y,z,x,y+d,z);
  }
  ornament.add(new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(diamonds,3)),decorationMaterial(.35)));
  const dust=[];let seed=41;function rnd(){seed=seed*16807%2147483647;return(seed-1)/2147483646}
  for(let i=0;i<500;i++)dust.push((rnd()-.5)*22,(rnd()-.5)*17,-4-rnd()*5);
  const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(dust,3)),new THREE.PointsMaterial({color:0xbacdeb,size:.016,transparent:true,opacity:.58}));scene.add(stars);
  let paused=false,dragging=false,pointer=null,lastX=0,lastY=0,downX=0,downY=0,w=1,h=1,dirty=true,labelsDirty=true,last=0,frame=null,zoom=1,narrow=false,baseDistance=13;
  const pause=container.querySelector('.pause-viz'),project=new THREE.Vector3();
  function syncPause(){pause.textContent=reduced.matches?'静态光效':paused?'播放光效':'暂停光效';pause.disabled=reduced.matches;pause.setAttribute('aria-label',reduced.matches?'系统已启用减少动态效果':paused?'播放星盘光效':'暂停星盘光效');pause.setAttribute('aria-pressed',String(paused||reduced.matches))}syncPause();
  function fit(){baseDistance=Math.max((narrow?5.9:4.95)/Math.tan(19*Math.PI/180),(narrow?2.65:4.4)/(camera.aspect*Math.tan(19*Math.PI/180)));camera.position.set(0,0,baseDistance*zoom);camera.lookAt(0,0,0)}
  function size(){const rect=container.getBoundingClientRect();if(rect.width<1||rect.height<1)return;w=rect.width;h=rect.height;narrow=w<(graph.kind==='planescape'?800:graph.kind?600:520);const minimum=narrow&&graph.kind?Math.max(650,300+(graph.rowCount-1)*62):0;const minStyle=minimum?minimum+'px':'';if(container.style.minHeight!==minStyle){container.style.minHeight=minStyle;requestAnimationFrame(size);return}renderer.setSize(w,h);camera.aspect=w/h;
   fit();nodes.forEach(n=>{n.mesh.position.set(...n.base);if(narrow){const [col,row]=mobileRows[n.mesh.userData.id],units=2*Math.tan(19*Math.PI/180)*(baseDistance-n.base[2])/h;const targetY=graph.kind?190+row*(h-300)/(graph.rowCount-1):145+row*(h-250)/6;n.mesh.position.x=col*w*.25*units;n.mesh.position.y=(h/2-targetY+30)*units}n.halo.position.copy(n.mesh.position);n.ring.position.copy(n.mesh.position)});connect();ornament.scale.set(narrow?.59:1,narrow?1.35:1,1);camera.updateProjectionMatrix();dirty=labelsDirty=true;request()}
  function draw(time){frame=null;if(activeSection!==chapter||document.hidden){last=0;return}const delta=last?Math.min((time-last)/1000,.05):0;last=time;
   // Only the engraved decoration turns; reading targets remain steady.
   if(!paused&&!reduced.matches){ornament.rotation.z+=delta*.018;dirty=true}
   if(dirty){group.updateMatrixWorld();if(labelsDirty){const placed=[];nodes.forEach(n=>{
    n.mesh.getWorldPosition(project);project.project(camera);const lw=n.label.offsetWidth||100,lh=n.label.offsetHeight||32;
    const px=Math.max(lw/2+14,Math.min(w-lw/2-14,(project.x+1)*w/2));const py=Math.max(115,Math.min(h-105,(-project.y+1)*h/2+30));let chosen=py;
    for(const off of [0,-46,46,-92,92,-138,138]){const cy=Math.max(115,Math.min(h-105,py+off)),box={x:px-lw/2,y:cy-lh/2,w:lw,h:lh};if(!placed.some(b=>box.x<b.x+b.w+5&&box.x+box.w+5>b.x&&box.y<b.y+b.h+5&&box.y+box.h+5>b.y)){chosen=cy;break}}
    placed.push({x:px-lw/2,y:chosen-lh/2,w:lw,h:lh});n.label.style.left=(px-lw/2)+'px';n.label.style.top=(chosen-lh/2)+'px';
   });labelsDirty=false}renderer.render(scene,camera);dirty=false}if(!paused&&!reduced.matches)request();
  }
  function request(){if(frame===null&&activeSection===chapter&&!document.hidden)frame=requestAnimationFrame(draw)}
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(pointer!==null||e.button!==0)return;pointer=e.pointerId;lastX=downX=e.clientX;lastY=downY=e.clientY;dragging=e.pointerType!=='touch';if(dragging)canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(dragging&&e.pointerId===pointer){group.rotation.y+=(e.clientX-lastX)*.004;group.rotation.x=Math.max(-.8,Math.min(.8,group.rotation.x+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;dirty=labelsDirty=true;request()}});
  canvas.addEventListener('pointerup',e=>{if(e.pointerId!==pointer)return;pointer=null;dragging=false;if(Math.hypot(e.clientX-downX,e.clientY-downY)<5){const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/w*2-1,-(e.clientY-rect.top)/h*2+1),camera);const hit=ray.intersectObjects(nodes.map(n=>n.mesh));if(hit.length){const id=hit[0].object.userData.id;selectPlane(id);openEntry(id)}}dirty=labelsDirty=true;request()});
  canvas.addEventListener('pointercancel',()=>{pointer=null;dragging=false});
  function scale(factor){zoom=Math.max(.8,Math.min(1.4,zoom*factor));fit();dirty=labelsDirty=true;request()}
  canvas.addEventListener('wheel',e=>{if(document.activeElement!==canvas)return;e.preventDefault();scale(e.deltaY>0?1.05:.95)},{passive:false});
  canvas.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft'||e.key==='ArrowRight')group.rotation.y+=e.key==='ArrowLeft'?-.08:.08;else group.rotation.x=Math.max(-.8,Math.min(.8,group.rotation.x+(e.key==='ArrowUp'?-.08:.08)));dirty=labelsDirty=true;request()}else if(['+','=','-'].includes(e.key)){e.preventDefault();scale(e.key==='-'?1.05:.95)}});
  pause.addEventListener('click',()=>{paused=!paused;syncPause();last=0;dirty=labelsDirty=true;request()});
  container.querySelector('.reset-viz').addEventListener('click',()=>{group.rotation.set(0,0,0);zoom=1;fit();dirty=labelsDirty=true;request()});
  function select(id){nodes.forEach(n=>{const on=n.mesh.userData.id===id;n.mesh.material.emissiveIntensity=on?.8:.3;n.halo.material.opacity=on?.6:.3;n.label.classList.toggle('active',on);n.label.setAttribute('aria-pressed',String(on))});dirty=labelsDirty=true;request()}
  window.addEventListener('planeselect',e=>select(e.detail));select(selectedPlane);
  window.addEventListener('chapterchange',()=>{last=0;if(activeSection===chapter)size();else if(frame!==null){cancelAnimationFrame(frame);frame=null}});
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null}else request()});
  reduced.addEventListener('change',()=>{syncPause();last=0;dirty=labelsDirty=true;request()});
  function palette(){const isLight=document.body.classList.contains('light');stars.material.color.set(isLight?0x68809d:0xbacdeb);stars.material.opacity=isLight?.42:.58;decorationMaterials.forEach(({material,opacity})=>{material.color.set(isLight?0x896632:0xd6b979);material.opacity=isLight?Math.min(1,opacity*1.2):opacity});dirty=labelsDirty=true;request()}palette();
  new MutationObserver(palette).observe(document.body,{attributes:true,attributeFilter:['class']});
  new ResizeObserver(size).observe(container);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;if(frame!==null)cancelAnimationFrame(frame);frame=null;canvas.hidden=true;layer.hidden=true;container.querySelector('.fallback').hidden=false;container.querySelectorAll('.pause-viz,.reset-viz').forEach(b=>b.disabled=true)});
  views.push({container,renderer,scene,camera,nodes,group,ornament});size();request();
 }
 build(document.getElementById('home-viz'),'cosmos');window.CODEX_VIEWS=views;
})();
