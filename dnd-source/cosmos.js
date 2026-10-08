(()=>{
 if(!window.THREE)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const views=[];
 function build(container,chapter){
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}catch(e){container.querySelectorAll('.pause-viz,.reset-viz').forEach(b=>b.disabled=true);return}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0x101717,0);container.prepend(renderer.domElement);
  container.querySelector('.fallback').hidden=true;
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.position.set(0,1.5,11.8);camera.lookAt(0,0,0);
  const group=new THREE.Group();scene.add(group);group.rotation.set(.32,-.4,-.09);
  scene.add(new THREE.AmbientLight(0xc5e0d3,1.2));const light=new THREE.PointLight(0xffd39b,30);light.position.set(-3,5,6);scene.add(light);
  const nodes=[];const layer=container.querySelector('.label-layer');
  const config=[['material',0,0,0,.57],['feywild',-1.65,.55,.15,.22],['shadowfell',1.6,-.55,.1,.22],['ethereal',-2.35,-.9,-.4,.17],['astral',2.45,.9,-.4,.22],['elemental',-2.3,1.85,-.6,.26],['outer',2.5,-1.65,-.8,.28],['sigil',0,2.35,-1,.21],['hells',1.5,-2.65,.2,.20],['abyss',-.95,-2.55,.1,.22],['demiplane',-3.1,.05,-1.1,.13]];
  config.forEach(([id,x,y,z,r])=>{
   const d=DATA.planes.find(p=>p.id===id);
   const mat=new THREE.MeshStandardMaterial({color:d.color,emissive:d.color,emissiveIntensity:id==='material'?.24:.4,roughness:.7,metalness:.3});
   const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(r,id==='material'?2:1),mat);mesh.position.set(x,y,z);mesh.userData.id=id;group.add(mesh);
   const halo=new THREE.Mesh(new THREE.SphereGeometry(r*1.3,20,16),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.06,depthWrite:false}));halo.position.copy(mesh.position);group.add(halo);
   const ring=new THREE.Mesh(new THREE.TorusGeometry(r*1.6,.007,6,70),new THREE.MeshBasicMaterial({color:d.color,transparent:true,opacity:.6}));ring.position.copy(mesh.position);ring.rotation.x=1;group.add(ring);
   if(id!=='material'){
    const points=[new THREE.Vector3(0,0,0),new THREE.Vector3(x*.45,y*.65,z+.3),new THREE.Vector3(x,y,z)];
    const curve=new THREE.QuadraticBezierCurve3(...points);
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)),new THREE.LineBasicMaterial({color:d.color,transparent:true,opacity:.17})));
   }
   const label=document.createElement('button');label.className='node-label';label.textContent=d.name;label.dataset.plane=id;label.setAttribute('aria-label','选择'+d.name);layer.append(label);
   nodes.push({mesh,halo,ring,label,r});
  });
  [1.55,2.9,3.55].forEach((r,i)=>{const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.005,6,160),new THREE.MeshBasicMaterial({color:0x9eae81,transparent:true,opacity:.18}));ring.rotation.x=Math.PI/2+(i*.25);ring.rotation.z=i*.35;group.add(ring)});
  const points=[];let seed=41;function rnd(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646}
  for(let i=0;i<900;i++)points.push((rnd()-.5)*24,(rnd()-.5)*18,(rnd()-.5)*10-6);
  const stars=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(points,3)),new THREE.PointsMaterial({color:0xc9dabf,size:.017,transparent:true,opacity:.58}));scene.add(stars);
  const centralWire=new THREE.LineSegments(new THREE.WireframeGeometry(nodes[0].mesh.geometry),new THREE.LineBasicMaterial({color:0xffe2a4,transparent:true,opacity:.3}));group.add(centralWire);
  let paused=reduced,dragging=false,lastX=0,lastY=0,downX=0,downY=0,w=1,h=1,dirty=true,last=0,frame=null;
  const pause=container.querySelector('.pause-viz');pause.textContent=paused?'播放':'暂停';pause.setAttribute('aria-label',paused?'播放三维动画':'暂停三维动画');
  const project=new THREE.Vector3();
  function size(){const rect=container.getBoundingClientRect();if(rect.width<1||rect.height<1)return;w=rect.width;h=rect.height;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();dirty=true;request()}
  const observer=new ResizeObserver(size);observer.observe(container);
  function draw(time){
   frame=null;const visible=activeSection===chapter&&!document.hidden;
   if(!visible){last=0;return}
   const delta=last?Math.min((time-last)/1000,.04):0;last=time;
   if(!paused&&!dragging){group.rotation.y+=delta*.045;dirty=true}
   if(dirty){
    group.updateMatrixWorld();const placed=[];nodes.forEach(n=>{
     n.mesh.getWorldPosition(project);project.y+=n.r+.15;project.project(camera);
     const lw=n.label.textContent.length*12+16,lh=24;
     const px=Math.max(lw/2+12,Math.min(w-lw/2-12,(project.x+1)*w/2));
     const py=Math.max(95,Math.min(h-85,(-project.y+1)*h/2));let chosen=py;
     for(const off of [0,-26,26,-52,52,-78,78]){
      const cy=Math.max(95,Math.min(h-85,py+off));const box={x:px-lw/2,y:cy-lh/2,w:lw,h:lh};
      if(!placed.some(b=>box.x<b.x+b.w+3&&box.x+box.w+3>b.x&&box.y<b.y+b.h+3&&box.y+box.h+3>b.y)){chosen=cy;break}
     }
     placed.push({x:px-lw/2,y:chosen-lh/2,w:lw,h:lh});n.label.style.left=px+'px';n.label.style.top=chosen+'px';n.label.style.opacity=project.z>1?'0':'1';
    });
    centralWire.rotation.copy(nodes[0].mesh.rotation);renderer.render(scene,camera);dirty=false;
   }
   if(!paused)request();
  }
  function request(){if(frame===null&&activeSection===chapter&&!document.hidden)frame=requestAnimationFrame(draw)}
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=downX=e.clientX;lastY=downY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)});
  renderer.domElement.addEventListener('pointermove',e=>{if(dragging){group.rotation.y+=(e.clientX-lastX)*.004;group.rotation.x=Math.max(-.9,Math.min(.9,group.rotation.x+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;dirty=true;request()}});
  renderer.domElement.addEventListener('pointerup',e=>{
   dragging=false;if(Math.hypot(e.clientX-downX,e.clientY-downY)<5){const rect=renderer.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/w*2-1,-(e.clientY-rect.top)/h*2+1),camera);const found=ray.intersectObjects(nodes.map(n=>n.mesh));if(found.length){const id=found[0].object.userData.id;selectPlane(id);if(chapter==='overview')openEntry(id)}}dirty=true;request();
  });
  renderer.domElement.addEventListener('pointercancel',()=>{dragging=false});
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.position.multiplyScalar(e.deltaY>0?1.05:.95);const distance=camera.position.length();if(distance<8)camera.position.setLength(8);if(distance>18)camera.position.setLength(18);camera.lookAt(0,0,0);dirty=true;request()},{passive:false});
  pause.addEventListener('click',()=>{paused=!paused;pause.textContent=paused?'播放':'暂停';pause.setAttribute('aria-label',paused?'播放三维动画':'暂停三维动画');last=0;dirty=true;request()});
  container.querySelector('.reset-viz').addEventListener('click',()=>{group.rotation.set(.32,-.4,-.09);camera.position.set(0,1.5,11.8);camera.lookAt(0,0,0);dirty=true;request()});
  function select(id){nodes.forEach(n=>{const on=n.mesh.userData.id===id;n.mesh.material.emissiveIntensity=on?.72:.25;n.halo.material.opacity=on?.13:.05;n.label.classList.toggle('active',on)});dirty=true;request()}
  window.addEventListener('planeselect',e=>select(e.detail));select(selectedPlane);
  window.addEventListener('chapterchange',()=>{last=0;if(activeSection===chapter){size();dirty=true;request()}else if(frame!==null){cancelAnimationFrame(frame);frame=null}});
  document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null}else request()});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();paused=true;if(frame!==null)cancelAnimationFrame(frame);frame=null;renderer.domElement.hidden=true;layer.hidden=true;container.querySelector('.fallback').hidden=false;container.querySelectorAll('.pause-viz,.reset-viz').forEach(b=>b.disabled=true)});
  views.push({container,renderer,scene,camera,nodes});size();request();
 }
 build(document.getElementById('home-viz'),'overview');build(document.getElementById('cosmos-viz'),'cosmos');
 window.CODEX_VIEWS=views;
})();
