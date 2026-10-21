import * as THREE from 'three';
import {matrixMaterial,setCodeTime,setCodeMotion,setCodeDensity,triggerCodePulse} from './matrixMaterial.js';
import './style.css';
import {createForest} from './forest.js';

const app=document.querySelector('#app');
app.innerHTML=`
<div id="viewport" aria-label="3D digital world"></div>
<div id="vignette" aria-hidden="true"></div>
<div class="topbar"><a class="brand" href="/" aria-label="SourceWorld home"><span class="brandmark">◈</span><span> SOURCE<span class="brand-accent">WORLD</span></span></a><div class="topmeta"><span class="dot"></span><span>SIMULATION ACTIVE</span><span class="separator">/</span><span id="coordinates">X 0.0 · Z 0.0</span></div><button class="icon-btn" id="settings-btn" aria-label="Open settings" aria-expanded="false">⚙</button></div>
<div class="crosshair" aria-hidden="true"><span></span></div>
<div class="bottomleft"><div class="eyebrow">SECTORS 01–02 / THE SIMULATION · V0.3</div><div class="location" id="location">THE AWAKENING</div><div class="hint" id="hint">W A S D TO MOVE <span>·</span> MOUSE TO LOOK <span>·</span> SHIFT TO RUN</div></div>
<div id="interaction" class="interaction" role="status" aria-live="polite"></div><div id="message" class="message" role="status" aria-live="polite"></div><div class="objectives" id="objectives"><span class="objectives-label" id="objective-label">SIGNAL RECOVERY</span><span id="progress">0 / 3 FRAGMENTS</span><div class="progress-track"><div id="progress-bar"></div></div></div><div class="bottomright"><div class="signal">◉ <span>WORLD ONLINE</span></div><div id="fps">— FPS</div></div>
<div class="settings hidden" id="settings" role="dialog" aria-label="World settings"><div class="panel-title"><span>WORLD PARAMETERS</span><button id="settings-close" aria-label="Close settings">×</button></div><label for="density">Code density <output id="density-value">100%</output></label><input id="density" type="range" min="60" max="160" value="100"/><label for="motion">Simulation speed <output id="motion-value">100%</output></label><input id="motion" type="range" min="0" max="200" value="100"/><label for="quality">Rendering quality</label><select id="quality"><option value="1">Balanced</option><option value=".65">Performance</option><option value="1.5">High fidelity</option></select><label class="checkbox"><input id="reduced" type="checkbox"/> Reduce motion</label><div class="panel-small">Press ESC to unlock the cursor at any time.</div></div>
<div class="overlay" id="intro"><div class="scanlines"></div><div class="intro-content"><div class="symbol">◈</div><p class="intro-index">TRANSMISSION 001 <span>—</span> SYSTEM INITIALIZED</p><h1>REALITY IS<br/><em>WRITTEN.</em></h1><p class="intro-copy">The simulation is waking up. Recover three lost signals, activate the Source Node, then follow the glowing trail into the forest. Something is waiting among the trees.</p><button id="enter" class="enter">ENTER THE CONSTRUCT <span>↗</span></button><p class="controls">W A S D — MOVE <span>•</span> MOUSE — LOOK <span>•</span> SPACE — JUMP <span>•</span> E — INTERACT <span>•</span> ESC — PAUSE</p></div><div class="intro-aside">SOURCEWORLD / BUILD 0.3.0<br/>EVERYTHING IS CODE.</div></div>
<div id="touch-controls"><div id="joystick" aria-label="Move joystick"><div id="joystick-knob"></div></div><button id="jump" aria-label="Jump">↑</button><span class="touch-hint">DRAG TO LOOK</span></div>
`;

const scene=new THREE.Scene();scene.background=new THREE.Color('#010807');scene.fog=new THREE.FogExp2('#010807',.019);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.08,210); camera.position.set(0,1.72,7.8);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
document.querySelector('#viewport').append(renderer.domElement);
const geometries={box:new THREE.BoxGeometry(1,1,1),cylinder:new THREE.CylinderGeometry(1,1,1,10,1),cone:new THREE.ConeGeometry(1,1,9),sphere:new THREE.IcosahedronGeometry(1,2)};
const solidity=[];
const interactables=[];
const recovered=new Set();
const interactionLabel=document.querySelector('#interaction');
const messageLabel=document.querySelector('#message');
let messageUntil=0;
function announce(message,duration=5){messageLabel.textContent=message;messageLabel.classList.add('visible');messageUntil=clock.elapsedTime+duration;}
function block(x,y,z,w,h,d,opts={}){
 const mesh=new THREE.Mesh(geometries.box,matrixMaterial(opts.tileX||Math.max(4,w*5),opts.tileY||Math.max(4,h*5),opts.glow||1,opts.seed));
 mesh.position.set(x,y,z);mesh.scale.set(w,h,d);scene.add(mesh);
 if(opts.solid)solidity.push({x,z,w,d,y,h});return mesh;
}
function cylinder(x,y,z,r,h,top=r){
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,r,h,12,1),matrixMaterial(15,Math.max(9,h*6),1.2));mesh.position.set(x,y,z);scene.add(mesh);return mesh;
}
const trimMat=new THREE.MeshBasicMaterial({color:'#0a7143'});
function edgeBox(x,y,z,w,h,d,opacity=.36){
 const geometry=new THREE.EdgesGeometry(new THREE.BoxGeometry(w,h,d));
 const lines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:'#188a59',transparent:true,opacity}));
 lines.position.set(x,y,z);scene.add(lines);
}
function architecture(x,y,z,w,h,d,opts={}){
 block(x,y,z,w,h,d,{solid:opts.solid!==false,glow:opts.glow||.75});
 if(opts.edges!==false)edgeBox(x,y,z,w,h,d,opts.opacity??.26);
}
const ambient=new THREE.AmbientLight('#31cc77',.4);scene.add(ambient);
const beacon=new THREE.PointLight('#2aff8a',25,35);beacon.position.set(0,6,-25);scene.add(beacon);

// Interior awakening: a physical corridor that opens to a dramatic constructed city.
architecture(0,-.5,2,14,1,18,{solid:false});
architecture(0,5.5,2,14,1,18,{solid:false});
architecture(-7,2.5,2,.8,6,18);
architecture(7,2.5,2,.8,6,18);
architecture(-4.75,2.5,-7,.7,6,1.1);
architecture(4.75,2.5,-7,.7,6,1.1);
architecture(0,5,-7,9,1,1.1,{solid:false});
for(let z=-5;z<11;z+=4){
 for(let x of [-6.2,6.2]){
  architecture(x,2,z,.65,4,.65);
  block(x,4.28,z,1.35,.16,1.35,{glow:2});
 }
}
block(0,.035,1,1,.05,17,{tileX:4,tileY:60,glow:1.8});
for(let x of [-3,3])architecture(x,.9,2,1,1.8,1,{opacity:.16});
architecture(0,1,-3,2.5,2,1.5,{opacity:.52});
// Exterior terrain and avenue
architecture(0,-.55,-52,165,1,125,{solid:false,edges:false});
block(0,.025,-47,9,.06,110,{tileX:18,tileY:100,glow:.55});
for(let side of [-1,1]){
 for(let i=0;i<8;i++){
  let z=-16-i*13;
  const offset=11+((i*7)%12);
  const x=side*(offset+4);
  const height=11+((i*19)%33);
  architecture(x,height/2-.04,z,10+(i%3)*3,height,9+((i*5)%9),{opacity:.19,glow:.75});
  if(i%2===0){
   const px=side*8.4;
   cylinder(px,2.2,z, .4,4.4);
   block(px,4.5,z,1.4,.2,1.4,{glow:2});
  }
 }
}
// Sky monoliths, pylons, and the destination source node.
for(let i=0;i<18;i++){
 const angle=i*2.399, radius=30+(i%5)*11;
 const x=Math.cos(angle)*radius,z=-55+Math.sin(angle)*radius;
 const shard=new THREE.Mesh(geometries.box,matrixMaterial(7,18,.8));shard.position.set(x,18+i%8*4,z);shard.scale.set(.4,7+i%4*5,.4);shard.rotation.z=(i%5-2)*.13;scene.add(shard);
}
const sourceGroup=new THREE.Group();sourceGroup.position.set(0,5,-85);scene.add(sourceGroup);
const core=new THREE.Mesh(new THREE.IcosahedronGeometry(4,1),matrixMaterial(24,24,2.1));sourceGroup.add(core);
const ring=new THREE.Mesh(new THREE.TorusGeometry(6,.07,8,90),new THREE.MeshBasicMaterial({color:'#2fef89'}));sourceGroup.add(ring);
const ring2=ring.clone();ring2.rotation.y=Math.PI/2;sourceGroup.add(ring2);
for(let i=0;i<8;i++){
 const a=i/8*Math.PI*2;
 cylinder(Math.cos(a)*11,4,-85+Math.sin(a)*11,.6,8,.25);
}

// Distinct neighborhood structures and a recoverable data-fragment trail.
function beaconArtifact(x,z,number,label){
 const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,.35,8),matrixMaterial(18,5,1.9));
 base.position.y=.18;group.add(base);
 const prism=new THREE.Mesh(new THREE.OctahedronGeometry(.85,0),matrixMaterial(18,18,2.8));
 prism.position.y=2.05;group.add(prism);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(1.4,.035,6,48),new THREE.MeshBasicMaterial({color:'#9affe0',transparent:true,opacity:.75}));
 halo.position.y=2.05;halo.rotation.x=Math.PI/2;group.add(halo);
 const light=new THREE.PointLight('#67ffa4',4,13);light.position.y=2.1;group.add(light);
 interactables.push({number,label,group,prism,halo,light,x,z,done:false});
}
// Recoverable artifacts sit along the open central avenue.
beaconArtifact(2.5,-19,1,'ARCHIVE ECHO');
beaconArtifact(-2.5,-45,2,'MEMORY SEED');
beaconArtifact(2.5,-69,3,'ORIGIN TRACE');
// Architectural gateways draw the eye deeper toward the Source.
for(const z of [-29,-57,-78]){
 for(const x of [-5.8,5.8]){
  architecture(x,6,z,1.15,12,1.5,{opacity:.42,glow:1.15});
  block(x,11.5,z,1.5,.18,2,{glow:2.3});
 }
 block(0,12,z,12.6,.55,1.2,{glow:1.2});
 edgeBox(0,12,z,12.8,.7,1.4,.66);
}
// Floating data sculptures between towers.
const sculptures=[];
for(let i=0;i<9;i++){
 const side=i%2===0?-1:1;
 const obj=new THREE.Mesh(new THREE.OctahedronGeometry(1.2+(i%3)*.3,1),matrixMaterial(16,16,1.5));
 obj.position.set(side*(9+(i%4)*3),7+(i%3)*3,-20-i*9);
 scene.add(obj);sculptures.push({obj,phase:i*1.8,baseY:obj.position.y});
}
const finalHint=document.createElement('div');finalHint.className='source-hint';finalHint.textContent='';document.querySelector('#app').append(finalHint);
let sourceActivated=false;
function completeFragment(item){
 if(item.done)return;
 item.done=true;recovered.add(item.number);
 item.prism.material=matrixMaterial(16,16,.22);
 item.light.intensity=.45;
 item.halo.material.opacity=.22;
 triggerCodePulse(new THREE.Vector3(item.x,0,item.z),clock.elapsedTime);
 document.querySelector('#progress').textContent=recovered.size+' / 3 FRAGMENTS';
 document.querySelector('#progress-bar').style.width=(recovered.size/3*100)+'%';
 announce('FRAGMENT '+item.number+' RECOVERED — '+item.label+(recovered.size===3?' · THE SOURCE IS READY':''));
}
function interact(){
 if(!active)return;
 for(const item of interactables){
  if(!item.done&&Math.hypot(camera.position.x-item.x,camera.position.z-item.z)<3.4){completeFragment(item);return;}
 }
 if(recovered.size===3&&!sourceActivated&&Math.hypot(camera.position.x,camera.position.z+85)<13){
  sourceActivated=true;
  triggerCodePulse(new THREE.Vector3(0,0,-85),clock.elapsedTime);
  core.material=matrixMaterial(30,30,3.6);
  beacon.color.set('#a4ffe0');beacon.intensity=48;
  announce('SOURCE UNLOCKED · THE WORLD IS ONLY THE FIRST LAYER.',12);
  document.querySelector('#objective-label').textContent='FOLLOW THE FOREST TRAIL';
  document.querySelector('#progress').textContent='FIND THE HEART OF THE GROVE';
  document.querySelector('#progress-bar').style.width='0%';
  finalHint.textContent='SECTOR 02 UNLOCKED · BEYOND THE SOURCE  ◈';
  finalHint.classList.add('revealed');
  return;
 }
 if(sourceActivated&&!forest.interact.completed&&Math.hypot(camera.position.x-forest.interact.x,camera.position.z-forest.interact.z)<4.5){
  forest.activate();
  triggerCodePulse(new THREE.Vector3(0,0,-217),clock.elapsedTime);
  announce('THE HEART REMEMBERS · THE FOREST IS LISTENING.',12);
  document.querySelector('#objective-label').textContent='SECTOR 02 COMPLETE';
  document.querySelector('#progress').textContent='HEART OF THE GROVE RESTORED';
  document.querySelector('#progress-bar').style.width='100%';
  finalHint.textContent='SIMULATION LAYER 02 COMPLETE  ◈';
  finalHint.classList.add('revealed');
 }
}

const forest=createForest(scene);

const particlesCount=900;
const positions=new Float32Array(particlesCount*3);
for(let i=0;i<particlesCount;i++){positions[i*3]=(Math.random()-.5)*155;positions[i*3+1]=Math.random()*44;positions[i*3+2]=-110+Math.random()*130;}
const particlesGeo=new THREE.BufferGeometry();particlesGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
const particles=new THREE.Points(particlesGeo,new THREE.PointsMaterial({color:'#1acb70',size:.045,transparent:true,opacity:.48,depthWrite:false}));scene.add(particles);

const intro=document.querySelector('#intro'),enter=document.querySelector('#enter');
const settings=document.querySelector('#settings'),settingsBtn=document.querySelector('#settings-btn');
let active=false,locked=false,mobile=matchMedia('(pointer:coarse)').matches;
let yaw=0,pitch=0,vy=0,grounded=true;const keys=new Set();
const clock=new THREE.Clock();

function capture(){
 if(mobile){active=true;intro.classList.add('hidden');return;}
 renderer.domElement.requestPointerLock?.();
}
enter.addEventListener('click',capture);
renderer.domElement.addEventListener('click',()=>{if(active&&!mobile&&!settings.classList.contains('open'))capture();});
document.addEventListener('pointerlockchange',()=>{
 locked=document.pointerLockElement===renderer.domElement;
 if(locked){active=true;intro.classList.add('hidden');settings.classList.remove('open');}
 else if(active&&!mobile){intro.classList.remove('hidden');enter.innerHTML='RESUME SIMULATION <span>↗</span>';}
});
document.addEventListener('mousemove',e=>{
 if(!locked)return;yaw-=e.movementX*.0022;pitch=Math.max(-1.48,Math.min(1.48,pitch-e.movementY*.0022));
});
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.code==='KeyE'&&!e.repeat)interact();});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>keys.clear());
function toggleSettings(open){
 settings.classList.toggle('open',open);settings.classList.toggle('hidden',!open);
 settingsBtn.setAttribute('aria-expanded',String(open));
 if(open&&locked)document.exitPointerLock();
}
settingsBtn.addEventListener('click',()=>toggleSettings(!settings.classList.contains('open')));
document.querySelector('#settings-close').addEventListener('click',()=>toggleSettings(false));
document.querySelector('#density').addEventListener('input',e=>{const value=Number(e.target.value);setCodeDensity(value/100);document.querySelector('#density-value').textContent=value+'%';});
document.querySelector('#motion').addEventListener('input',e=>{const value=Number(e.target.value);setCodeMotion(value/100);document.querySelector('#motion-value').textContent=value+'%';});
document.querySelector('#quality').addEventListener('change',e=>{renderer.setPixelRatio(Math.min(devicePixelRatio,2)*Number(e.target.value));});
document.querySelector('#reduced').addEventListener('change',e=>{setCodeMotion(e.target.checked?0:Number(document.querySelector('#motion').value)/100);});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelector('#reduced').checked=true;setCodeMotion(0);}
// Touch input: left virtual joystick, right swipe camera control.
const joystick=document.querySelector('#joystick'),knob=document.querySelector('#joystick-knob');
let touchMoveX=0,touchMoveY=0,joystickId=null,lookId=null,lastLook={x:0,y:0};
if(mobile){document.querySelector('#touch-controls').classList.add('visible');}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!mobile||!active)return;
 if(e.clientX>=innerWidth*.35){lookId=e.pointerId;lastLook={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}
});
function updateJoystick(e){
 const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 touchMoveX=Math.max(-1,Math.min(1,(e.clientX-cx)/40));
 touchMoveY=Math.max(-1,Math.min(1,(e.clientY-cy)/40));
 knob.style.transform=`translate(${touchMoveX*32}px,${touchMoveY*32}px)`;
}
joystick.addEventListener('pointerdown',e=>{if(!active)return;e.preventDefault();joystickId=e.pointerId;joystick.setPointerCapture(e.pointerId);updateJoystick(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joystickId)updateJoystick(e);});
joystick.addEventListener('pointerup',resetJoystick);joystick.addEventListener('pointercancel',resetJoystick);
function resetJoystick(){joystickId=null;touchMoveX=touchMoveY=0;knob.style.transform='translate(0,0)';}
renderer.domElement.addEventListener('pointermove',e=>{if(!mobile||e.pointerId!==lookId)return;yaw-=(e.clientX-lastLook.x)*.005;pitch=Math.max(-1.48,Math.min(1.48,pitch-(e.clientY-lastLook.y)*.005));lastLook={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null;});
interactionLabel.addEventListener('click',interact);
document.querySelector('#jump').addEventListener('pointerdown',e=>{e.preventDefault();if(grounded){vy=5.1;grounded=false;}});
function collision(x,z){
 // Check each obstacle independently; an unrelated box must never end the test.
 for(const b of solidity){
  if(camera.position.y>b.y+b.h/2+.6||camera.position.y<b.y-b.h/2-1)continue;
  if(Math.abs(x-b.x)<b.w/2+.34&&Math.abs(z-b.z)<b.d/2+.34)return true;
 }
 for(const tree of forest.obstacles){
  if(Math.hypot(x-tree.x,z-tree.z)<tree.r+.3)return true;
 }
 return false;
}
let frameCount=0,lastFps=0;
function tick(){
 requestAnimationFrame(tick);
 let dt=Math.min(clock.getDelta(),.045),t=clock.elapsedTime;
 if(messageUntil&&t>messageUntil){messageLabel.classList.remove('visible');messageUntil=0;}
 for(const item of interactables){item.prism.rotation.y+=dt*.8;item.prism.position.y=2.05+Math.sin(t*1.7+item.number)*.22;item.halo.rotation.z+=dt*.28;}
 for(const item of sculptures){item.obj.rotation.y+=dt*.18;item.obj.rotation.z+=dt*.07;item.obj.position.y=item.baseY+Math.sin(t*.8+item.phase)*.55;}
 let nearby=interactables.find(i=>!i.done&&Math.hypot(camera.position.x-i.x,camera.position.z-i.z)<3.4);
 const nearSource=recovered.size===3&&!sourceActivated&&Math.hypot(camera.position.x,camera.position.z+85)<13;
 const nearHeart=sourceActivated&&!forest.interact.completed&&Math.hypot(camera.position.x,camera.position.z+217)<4.5;
 interactionLabel.textContent=nearby?'[ E ] RECOVER '+nearby.label:nearSource?'[ E ] ACTIVATE SOURCE':nearHeart?'[ E ] LISTEN TO THE HEART':mobile?'EXPLORE · APPROACH THE GLOWING SIGNALS':'';
 interactionLabel.classList.toggle('visible',!!(nearby||nearSource||nearHeart));
 forest.animate(t,dt,document.querySelector('#reduced').checked);
 setCodeTime(t);
 sourceGroup.rotation.y=t*.13;core.rotation.x=t*.06;
 ring.rotation.z=t*.11;ring2.rotation.x=t*.09;
 particles.rotation.y=t*.0003;
 if(active&&(locked||mobile)){
  const forward=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-touchMoveY;
  const strafe=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+touchMoveX;
  const direction=new THREE.Vector2(strafe,forward);if(direction.length()>1)direction.normalize();
  const speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?10:5;
  const sx=(Math.cos(yaw)*direction.x-Math.sin(yaw)*direction.y)*speed*dt;
  const sz=(-Math.sin(yaw)*direction.x-Math.cos(yaw)*direction.y)*speed*dt;
  const nextX=camera.position.x+sx,nextZ=camera.position.z+sz;
  if(!collision(nextX,camera.position.z))camera.position.x=nextX;
  if(!collision(camera.position.x,nextZ))camera.position.z=nextZ;
  if(keys.has('Space')&&grounded){vy=5.1;grounded=false;}
  vy-=13*dt;camera.position.y+=vy*dt;
  if(camera.position.y<=1.72){camera.position.y=1.72;vy=0;grounded=true;}
  camera.rotation.order='YXZ';camera.rotation.y=yaw;camera.rotation.x=pitch;
 }
 document.querySelector('#coordinates').textContent=`X ${camera.position.x.toFixed(1)} · Z ${camera.position.z.toFixed(1)}`;
 document.querySelector('#location').textContent=camera.position.z < -205?'HEART OF THE GROVE':camera.position.z < -110?'THE SIMULATION FOREST':camera.position.z < -70?'THE SOURCE NODE':camera.position.z < -10?'THE CONSTRUCT CITY':'THE AWAKENING';
 frameCount++;if(t-lastFps>1){document.querySelector('#fps').textContent=Math.round(frameCount/(t-lastFps))+' FPS';frameCount=0;lastFps=t;}
 renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
tick();
