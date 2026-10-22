import * as THREE from 'three';
import {matrixMaterial,setCodeTime,setCodeMotion,setCodeDensity,triggerCodePulse,setCodePlayerPosition,setCodeOutline} from './matrixMaterial.js';
import './style.css';
import {createForest} from './forest.js';
import {createDataSky} from './sky.js';
import {createOpenWorld} from './openWorld.js';
import {createReconstruction} from './reconstruction.js';
import {createGeneratedSectors} from './worldgen.js';
import {createSimulationWeather} from './weather.js';
import {createArtDirection} from './artDirection.js';
import {createLivingWorld} from './livingWorld.js';
import {createEcosystem} from './ecosystem.js';
import {createWorldMap} from './worldMap.js';
import {readContinuity,writeContinuity,clearContinuity,formatElapsed} from './continuity.js';

const app=document.querySelector('#app');
app.innerHTML=`
<div id="viewport" aria-label="3D digital world"></div>
<div id="vignette" aria-hidden="true"></div>
<div class="topbar"><a class="brand" href="/" aria-label="SourceWorld home"><span class="brandmark">◈</span><span> SOURCE<span class="brand-accent">WORLD</span></span></a><div class="topmeta"><span class="dot"></span><span>SIMULATION ACTIVE</span><span class="separator">/</span><span id="coordinates">X 0.0 · Z 0.0</span><span class="system-weather" id="weather-state" aria-live="off">ATMOSPHERE / STABLE</span></div><button class="icon-btn" id="settings-btn" aria-label="Open settings" aria-expanded="false">⚙</button></div>
<button id="pause-btn" class="pause-btn" type="button" aria-label="Pause and open settings" title="Pause / Settings (P)">Ⅱ <span>MENU [ P ]</span></button><button id="vision" class="vision-btn" aria-pressed="false" title="Toggle wireframe view">◈ <span>CODE VISION [ V ]</span></button><div class="wayfinder" aria-label="Navigation guide"><div class="wayfinder-heading">NEXT SIGNAL <span id="objective-distance">—</span></div><div id="objective-direction">◈ FORWARD / DISCOVER THE WORLD</div></div><div class="crosshair" aria-hidden="true"><span></span></div>
<button id="atlas-toggle" class="atlas-toggle" type="button" aria-expanded="false" aria-controls="world-map">⌁ ATLAS [ M ]</button><button id="journal-toggle" class="journal-toggle" type="button" aria-expanded="false" aria-controls="journal-panel">◈ FIELD NOTES <span id="journal-count">0</span></button><aside id="journal-panel" class="journal-panel hidden" aria-label="Field notes"><div class="journal-heading"><span>FIELD NOTES / OBSERVATIONS</span><button type="button" id="journal-close" aria-label="Close field notes">×</button></div><p class="journal-intro">A record of the world, the things you changed, and the things that happened anyway.</p><ol id="journal-list" aria-live="polite"><li class="journal-empty">Nothing recorded yet. The world is waiting.</li></ol></aside><div id="continuity-readout" class="continuity-readout" aria-live="off"><span id="world-day">DAY 1</span><span id="world-phase">DORMANT</span></div><div id="ecosystem-readout" class="ecosystem-readout" aria-live="off"><span class="eco-kicker">LOCAL ECOSYSTEM</span><strong id="eco-region">SIMULATION STABLE</strong><span id="eco-conditions">SYSTEMS INITIALIZING</span></div><div class="bottomleft"><div class="eyebrow">SIMULATION 001 / WORLD WITH MEMORY · V1.1</div><div class="location" id="location">THE AWAKENING</div><div class="hint" id="hint">W A S D TO MOVE <span>·</span> MOUSE TO LOOK <span>·</span> SHIFT TO RUN</div></div>
<button id="interaction" type="button" class="interaction" aria-label="Interact with nearby signal" disabled></button><div id="message" class="message" role="status" aria-live="polite"></div><div class="objectives" id="objectives"><span class="objectives-label" id="objective-label">SIGNAL RECOVERY</span><span id="progress">0 / 3 FRAGMENTS</span><div class="progress-track"><div id="progress-bar"></div></div></div><div class="bottomright"><div class="signal">◉ <span>WORLD ONLINE</span></div><div id="fps">— FPS</div></div>
<div class="pause-screen hidden" id="pause-screen" role="dialog" aria-label="Simulation paused" aria-modal="true"><div class="pause-panel"><div class="pause-eyebrow">TRANSMISSION INTERRUPTED</div><h2>SIMULATION <em>PAUSED.</em></h2><p>The world remains. Return whenever you are ready.</p><div class="pause-actions"><button id="resume-btn" type="button" class="pause-primary">RESUME EXPLORING <span>↗</span></button><button id="pause-settings-btn" type="button" class="pause-secondary">WORLD PARAMETERS ⚙</button></div><div class="pause-tip">P — PAUSE / RESUME · ESC — RELEASE CURSOR</div></div></div><div class="settings hidden" id="settings" role="dialog" aria-label="World settings"><div class="panel-title"><span>WORLD PARAMETERS</span><button id="settings-close" aria-label="Close settings">×</button></div><label for="density">Code density <output id="density-value">100%</output></label><input id="density" type="range" min="60" max="160" value="100"/><label for="outline">Object outlines <output id="outline-value">100%</output></label><input id="outline" type="range" min="0" max="180" value="100"/><label for="motion">Simulation speed <output id="motion-value">100%</output></label><input id="motion" type="range" min="0" max="200" value="100"/><label for="quality">Rendering quality</label><select id="quality"><option value="1">Balanced</option><option value=".65">Performance</option><option value="1.3">High fidelity</option></select><label class="checkbox"><input id="reduced" type="checkbox"/> Reduce motion</label><label class="checkbox"><input id="weather-toggle" type="checkbox" checked/> Simulation weather</label><div class="continuity-settings"><span>WORLD MEMORY · SAVED IN THIS BROWSER</span><span id="continuity-status">Checking local storage…</span><button type="button" id="reset-memory">RESET LOCAL WORLD MEMORY</button></div><div class="panel-small">Press P at any time to return to this menu. ESC releases the mouse cursor.</div></div>
<div class="overlay" id="intro"><div class="scanlines"></div><div class="intro-content"><div class="symbol">◈</div><p class="intro-index">TRANSMISSION 001 <span>—</span> SYSTEM INITIALIZED</p><h1>THE WORLD<br/><em>IS CODE.</em></h1><p class="intro-copy">Follow the connections: hungry creatures find food, plants recover after storms, inhabitants follow their routines. Open the Atlas to choose your own route.</p><div class="return-report hidden" id="return-report"><div class="return-eyebrow">WHILE YOU WERE AWAY</div><strong id="return-time"></strong><ul id="return-events"></ul></div><div class="intro-divider"><span>01 — EXPLORE</span><span>02 — RECOVER</span><span>03 — AWAKEN</span></div><button id="enter" class="enter">ENTER THE SIMULATION <span>↗</span></button><p class="controls">W A S D — MOVE <span>•</span> MOUSE — LOOK <span>•</span> SPACE — JUMP <span>•</span> E — INTERACT <span>•</span> V — CODE VISION <span>•</span> P — MENU</p></div><div class="intro-aside">SOURCEWORLD / BUILD 1.1.0<br/>EVERYTHING IS CODE.</div></div>
<div id="touch-controls"><div id="joystick" aria-label="Move joystick"><div id="joystick-knob"></div></div><button id="jump" aria-label="Jump">↑</button><span class="touch-hint">DRAG TO LOOK</span></div>
`;

const scene=new THREE.Scene();scene.background=new THREE.Color('#010807');scene.fog=new THREE.FogExp2('#010807',.012);
const camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.08,210); camera.position.set(0,1.72,7.8);
const renderer=new THREE.WebGLRenderer({antialias:!matchMedia('(pointer:coarse)').matches,powerPreference:'high-performance'});
let qualityScale=matchMedia('(pointer:coarse)').matches?.65:1;
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)*qualityScale);renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.25;
document.querySelector('#viewport').append(renderer.domElement);
const sky=createDataSky(scene);
const openWorld=createOpenWorld(scene);
const reconstruction=createReconstruction(scene);
const generatedSectors=createGeneratedSectors(scene,{seed:60421,count:155});
const simulationWeather=createSimulationWeather(scene,{particleCount:1500});
const artDirection=createArtDirection(scene);
const journalPanel=document.querySelector('#journal-panel');
const journalButton=document.querySelector('#journal-toggle');
const journalList=document.querySelector('#journal-list');
let notesOpen=false;
let mapOpen=false;
let chosenDestination=null;
function toggleJournal(open){
 notesOpen=open;journalPanel.classList.toggle('hidden',!open);
 journalButton.setAttribute('aria-expanded',String(open));
 if(open){if(everEntered&&!paused)pauseGame(true);document.querySelector('#journal-close').focus();}
 else journalButton.focus();
}
journalButton.addEventListener('click',()=>toggleJournal(!notesOpen));
document.querySelector('#journal-close').addEventListener('click',()=>toggleJournal(false));
const unifiedJournal=[];
function recordJournal(entry){
 unifiedJournal.unshift({type:entry.type,title:entry.title,description:entry.description});
 if(unifiedJournal.length>16)unifiedJournal.length=16;
 journalList.replaceChildren();
 unifiedJournal.forEach(item=>{
  const li=document.createElement('li');
  const category=document.createElement('small');category.textContent=item.type;
  const title=document.createElement('strong');title.textContent=item.title;
  const description=document.createElement('p');description.textContent=item.description;
  li.append(category,title,description);journalList.append(li);
 });
 document.querySelector('#journal-count').textContent=unifiedJournal.length;
}
const livingWorld=createLivingWorld(scene,{onEvent(event){
 recordJournal(event);
 if(event.type==='DISCOVERY'||event.type==='WITNESSED')announce(event.description,7);
}});
const ecosystem=createEcosystem(scene,{onEvent(event){
 recordJournal(event);
 if(event.type==='REGION')announce(event.title,4);
}});
const continuity=readContinuity();
let lastSavedAt=0;
let saveSupported=true;
if(continuity.saved){
 ecosystem.restore(continuity.snapshot);
 const changes=ecosystem.fastForward(continuity.elapsed);
 const report=document.querySelector('#return-report');
 if(continuity.elapsed>=45){
  report.classList.remove('hidden');
  document.querySelector('#return-time').textContent='The world continued for '+formatElapsed(continuity.elapsed)+'.';
  const list=document.querySelector('#return-events');
  (changes.length?changes:['The inhabitants followed their routines.','Living signals continued to move across the world.']).forEach(message=>{
   const li=document.createElement('li');li.textContent=message;list.append(li);
  });
 }
 continuity.history.forEach(entry=>recordJournal(entry));
}
function saveWorld(){
 saveSupported=writeContinuity(ecosystem.snapshot(),unifiedJournal);
 document.querySelector('#continuity-status').textContent=saveSupported?'Memory saved locally':'Browser storage unavailable — session only';
 return saveSupported;
}
window.addEventListener('pagehide',saveWorld);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveWorld();});
document.querySelector('#reset-memory').addEventListener('click',()=>{
 if(!window.confirm('Reset saved ecosystem history in this browser? The current session will remain until reload.'))return;
 const cleared=clearContinuity();
 document.querySelector('#continuity-status').textContent=cleared?'Saved memory cleared. Reload to start fresh.':'Unable to clear browser storage';
});
document.querySelector('#continuity-status').textContent=continuity.saved?'Previous world restored · autosave enabled':'New world · autosave enabled';
const atlasButton=document.querySelector('#atlas-toggle');
const atlas=createWorldMap({
 mount:app,regions:ecosystem.regions,getPlayer:()=>camera.position,
 onNavigate(location){chosenDestination=location;document.querySelector('#objective-label').textContent='ATLAS DESTINATION';},
 onClose(){toggleMap(false);}
});
function toggleMap(open){
 mapOpen=open;
 atlasButton.setAttribute('aria-expanded',String(open));
 if(open){
  if(notesOpen)toggleJournal(false);
  if(everEntered&&!paused)pauseGame(true);
  atlas.open();
 }else{
  atlas.close();
  atlasButton.focus();
 }
}
atlasButton.addEventListener('click',()=>toggleMap(!mapOpen));
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
 if(!active||menuVisible())return;
 const livingInteraction=livingWorld.interact(camera.position,clock.elapsedTime);
 if(livingInteraction){triggerCodePulse(new THREE.Vector3(livingInteraction.x,0,livingInteraction.z),clock.elapsedTime);return;}
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
let wireframe=false;
const visionButton=document.querySelector('#vision');
function setVision(enabled){
 wireframe=enabled;visionButton.setAttribute('aria-pressed',String(enabled));
 visionButton.classList.toggle('selected',enabled);
 visionButton.querySelector('span').textContent=enabled?'RESTORE CODE [ V ]':'CODE VISION [ V ]';
 scene.traverse(object=>{
  if(!object.isMesh||object.userData.noWireframe)return;
  const materials=Array.isArray(object.material)?object.material:[object.material];
  materials.forEach(material=>{if(material&&'wireframe' in material)material.wireframe=enabled;});
 });
}
visionButton.addEventListener('click',()=>setVision(!wireframe));

const particlesCount=900;
const positions=new Float32Array(particlesCount*3);
for(let i=0;i<particlesCount;i++){positions[i*3]=(Math.random()-.5)*155;positions[i*3+1]=Math.random()*44;positions[i*3+2]=-110+Math.random()*130;}
const particlesGeo=new THREE.BufferGeometry();particlesGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));
const particles=new THREE.Points(particlesGeo,new THREE.PointsMaterial({color:'#1acb70',size:.045,transparent:true,opacity:.48,depthWrite:false}));scene.add(particles);

const intro=document.querySelector('#intro'),enter=document.querySelector('#enter');
const pauseScreen=document.querySelector('#pause-screen'),pauseButton=document.querySelector('#pause-btn');
const resumeButton=document.querySelector('#resume-btn'),pauseSettingsButton=document.querySelector('#pause-settings-btn');
let paused=false,everEntered=false,unlockForMenu=false;
function menuVisible(){return paused||notesOpen||mapOpen||settings.classList.contains('open');}
function pauseGame(show=true){
 if(!everEntered)return;
 paused=show;keys.clear();resetJoystick();
 if(!show&&notesOpen){notesOpen=false;journalPanel.classList.add('hidden');journalButton.setAttribute('aria-expanded','false');}
 if(!show&&mapOpen){mapOpen=false;atlas.close();atlasButton.setAttribute('aria-expanded','false');}
 pauseScreen.classList.toggle('hidden',!show);
 pauseButton.setAttribute('aria-expanded',String(show));
 if(show){
  intro.classList.add('hidden');
  if(document.pointerLockElement===renderer.domElement){unlockForMenu=true;document.exitPointerLock();}
  resumeButton.focus();
 }else{
  toggleSettings(false);
  if(!mobile)capture();
 }
}
pauseButton.addEventListener('click',()=>pauseGame(!paused));
resumeButton.addEventListener('click',()=>pauseGame(false));
pauseSettingsButton.addEventListener('click',()=>toggleSettings(true));
const settings=document.querySelector('#settings'),settingsBtn=document.querySelector('#settings-btn');
let active=false,locked=false,mobile=matchMedia('(pointer:coarse)').matches;
const settingsTrigger=document.querySelector('#settings-btn');
journalPanel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();toggleJournal(false);}});
settings.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();toggleSettings(false);(paused?pauseSettingsButton:settingsTrigger).focus();}});
let yaw=0,pitch=0,vy=0,grounded=true;const keys=new Set();
const clock=new THREE.Clock();

function capture(){
 everEntered=true;paused=false;
 pauseScreen.classList.add('hidden');
 intro.classList.add('hidden');
 if(mobile){active=true;return;}
 const request=renderer.domElement.requestPointerLock?.();
 if(request&&typeof request.catch==='function')request.catch(()=>{intro.classList.remove('hidden');});
}
enter.addEventListener('click',capture);
renderer.domElement.addEventListener('click',()=>{if(active&&!mobile&&!menuVisible())capture();});
document.addEventListener('pointerlockchange',()=>{
 locked=document.pointerLockElement===renderer.domElement;
 if(locked){active=true;everEntered=true;paused=false;intro.classList.add('hidden');pauseScreen.classList.add('hidden');}
 else if(active&&!mobile){
  keys.clear();
  if(unlockForMenu){unlockForMenu=false;return;}
  pauseGame(true);
 }
});
document.addEventListener('mousemove',e=>{
 if(!locked)return;yaw-=e.movementX*.0022;pitch=Math.max(-1.48,Math.min(1.48,pitch-e.movementY*.0022));
});
window.addEventListener('keydown',e=>{
 const editing=['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName);
 if(e.code==='KeyM'&&!e.repeat&&!editing){e.preventDefault();toggleMap(!mapOpen);return;}
 if(e.code==='KeyJ'&&!e.repeat&&!editing){e.preventDefault();toggleJournal(!notesOpen);return;}
 if(e.code==='KeyP'&&!e.repeat&&!editing){e.preventDefault();if(everEntered)pauseGame(!paused);return;}
 if(e.code==='Escape'&&paused&&!settings.classList.contains('open')&&!notesOpen&&!mapOpen){e.preventDefault();pauseGame(false);return;}
 if(menuVisible()||editing)return;
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 keys.add(e.code);
 if(e.code==='KeyE'&&!e.repeat)interact();
 if(e.code==='KeyV'&&!e.repeat)setVision(!wireframe);
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();resetJoystick();});
function toggleSettings(open){
 if(open&&everEntered&&!paused)pauseGame(true);
 settings.classList.toggle('open',open);settings.classList.toggle('hidden',!open);
 settingsBtn.setAttribute('aria-expanded',String(open));
 if(open){settings.style.zIndex='30';document.querySelector('#settings-close').focus();}
 else if(paused){pauseSettingsButton.focus();}
}

settingsBtn.addEventListener('click',()=>toggleSettings(!settings.classList.contains('open')));
document.querySelector('#settings-close').addEventListener('click',()=>toggleSettings(false));
document.querySelector('#weather-toggle').addEventListener('change',e=>simulationWeather.setEnabled(e.target.checked));
document.querySelector('#outline').addEventListener('input',e=>{const value=Number(e.target.value);setCodeOutline(value/100);document.querySelector('#outline-value').textContent=value+'%';});
document.querySelector('#density').addEventListener('input',e=>{const value=Number(e.target.value);setCodeDensity(value/100);document.querySelector('#density-value').textContent=value+'%';});
document.querySelector('#motion').addEventListener('input',e=>{const value=Number(e.target.value);setCodeMotion(value/100);document.querySelector('#motion-value').textContent=value+'%';});
const qualityInput=document.querySelector('#quality');
if(matchMedia('(pointer:coarse)').matches)qualityInput.value='.65';
qualityInput.addEventListener('change',e=>{qualityScale=Number(e.target.value);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)*qualityScale);});
document.querySelector('#reduced').addEventListener('change',e=>{setCodeMotion(e.target.checked?0:Number(document.querySelector('#motion').value)/100);});
if(matchMedia('(prefers-reduced-motion: reduce)').matches){document.querySelector('#reduced').checked=true;setCodeMotion(0);}
// Touch input: left virtual joystick, right swipe camera control.
const joystick=document.querySelector('#joystick'),knob=document.querySelector('#joystick-knob');
let touchMoveX=0,touchMoveY=0,joystickId=null,lookId=null,lastLook={x:0,y:0};
if(mobile){document.querySelector('#touch-controls').classList.add('visible');}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!mobile||!active||menuVisible())return;
 if(e.clientX>=innerWidth*.35){lookId=e.pointerId;lastLook={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}
});
function updateJoystick(e){
 const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
 touchMoveX=Math.max(-1,Math.min(1,(e.clientX-cx)/40));
 touchMoveY=Math.max(-1,Math.min(1,(e.clientY-cy)/40));
 knob.style.transform=`translate(${touchMoveX*32}px,${touchMoveY*32}px)`;
}
joystick.addEventListener('pointerdown',e=>{if(!active||menuVisible())return;e.preventDefault();joystickId=e.pointerId;joystick.setPointerCapture(e.pointerId);updateJoystick(e);});
joystick.addEventListener('pointermove',e=>{if(e.pointerId===joystickId)updateJoystick(e);});
joystick.addEventListener('pointerup',resetJoystick);joystick.addEventListener('pointercancel',resetJoystick);
function resetJoystick(){joystickId=null;touchMoveX=touchMoveY=0;knob.style.transform='translate(0,0)';}
renderer.domElement.addEventListener('pointermove',e=>{if(!mobile||e.pointerId!==lookId)return;yaw-=(e.clientX-lastLook.x)*.005;pitch=Math.max(-1.48,Math.min(1.48,pitch-(e.clientY-lastLook.y)*.005));lastLook={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{if(e.pointerId===lookId)lookId=null;});
renderer.domElement.addEventListener('pointercancel',e=>{if(e.pointerId===lookId)lookId=null;});
interactionLabel.addEventListener('click',interact);
document.querySelector('#jump').addEventListener('pointerdown',e=>{e.preventDefault();if(!menuVisible()&&grounded){vy=5.1;grounded=false;}});
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
 if(active&&t-lastSavedAt>22){lastSavedAt=t;saveWorld();}
 const reduced=document.querySelector('#reduced').checked;
 sky.update(camera,t,reduced?0:Number(document.querySelector('#motion').value)/100);
 const atmosphere=simulationWeather.update(camera,t,dt,!reduced);
 artDirection.update(t,dt,reduced);
 const ecosystemState=ecosystem.update(t,dt,camera.position,{paused:menuVisible()||!active,reduced,weather:atmosphere});
 document.querySelector('#world-day').textContent='DAY '+ecosystem.getDay();
 const phase=ecosystem.getPhase();
 document.querySelector('#world-phase').textContent=phase<.2?'NIGHT':phase<.36?'DAWN':phase<.68?'DAYLIGHT':phase<.84?'DUSK':'NIGHT';
 document.querySelector('#eco-region').textContent=ecosystemState.region||'SIMULATION STABLE';
 const eco=ecosystemState.summary.find(b=>b.name===ecosystemState.region);
 document.querySelector('#eco-conditions').textContent=eco?'MOISTURE '+Math.round(eco.humidity*100)+'%  ·  GROWTH '+Math.round(eco.growth*100)+'%':'EXPLORE TO OBSERVE LIFE';
 livingWorld.update(t,dt,camera.position,{motion:!reduced,paused:menuVisible()});
 document.querySelector('#weather-state').textContent='ATMOSPHERE / '+atmosphere;
 const found=openWorld.update(t,dt,camera.position,!document.querySelector('#reduced').checked);
 if(reconstruction.update(t,dt,camera.position,!document.querySelector('#reduced').checked)&&active){
  announce('THE MIRROR REASSEMBLES WHEN OBSERVED. IS PERCEPTION PART OF THE CODE?',8);
  triggerCodePulse(new THREE.Vector3(-43,0,-34),t);
 }
 if(found&&active){found.visited=true;announce(found.text,7);triggerCodePulse(new THREE.Vector3(found.x,0,found.z),t);}
 if(messageUntil&&t>messageUntil){messageLabel.classList.remove('visible');messageUntil=0;}
 for(const item of interactables){if(!reduced){item.prism.rotation.y+=dt*.8;item.prism.position.y=2.05+Math.sin(t*1.7+item.number)*.22;item.halo.rotation.z+=dt*.28;}}
 for(const item of sculptures){if(!reduced){item.obj.rotation.y+=dt*.18;item.obj.rotation.z+=dt*.07;item.obj.position.y=item.baseY+Math.sin(t*.8+item.phase)*.55;}}
 let nearby=interactables.find(i=>!i.done&&Math.hypot(camera.position.x-i.x,camera.position.z-i.z)<3.4);
 const nearSource=recovered.size===3&&!sourceActivated&&Math.hypot(camera.position.x,camera.position.z+85)<13;
 const nearHeart=sourceActivated&&!forest.interact.completed&&Math.hypot(camera.position.x,camera.position.z+217)<4.5;
 const livingNearby=livingWorld.encounters.find(item=>Math.hypot(camera.position.x-item.x,camera.position.z-item.z)<item.r);
 interactionLabel.textContent=nearby?'[ E ] RECOVER '+nearby.label:nearSource?'[ E ] ACTIVATE SOURCE':nearHeart?'[ E ] LISTEN TO THE HEART':livingNearby?'[ E ] LISTEN TO '+livingNearby.title:mobile?'EXPLORE · APPROACH THE GLOWING SIGNALS':'';
 const canInteract=!!(nearby||nearSource||nearHeart||livingNearby);
 interactionLabel.classList.toggle('visible',canInteract);
 interactionLabel.disabled=!canInteract||menuVisible();
 forest.animate(t,dt,reduced);
 forest.updateVisibility(camera.position);
 setCodeTime(t);
 setCodePlayerPosition(camera.position);
 if(!reduced){sourceGroup.rotation.y=t*.13;core.rotation.x=t*.06;
 ring.rotation.z=t*.11;ring2.rotation.x=t*.09;
 particles.rotation.y=t*.0003;}
 if(active&&!paused&&!menuVisible()&&(locked||mobile)){
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
 const nextTarget=chosenDestination?{...chosenDestination,label:chosenDestination.name}:interactables.find(item=>!item.done)||(!sourceActivated?{x:0,z:-85,label:'SOURCE NODE'}:!forest.interact.completed?{x:0,z:-217,label:'HEART OF THE GROVE'}:null);
 const wayfinder=document.querySelector('#objective-direction');
 const metric=document.querySelector('#objective-distance');
 if(nextTarget){
  const dx=nextTarget.x-camera.position.x,dz=nextTarget.z-camera.position.z;
  const heading=Math.atan2(dx,-dz)+yaw;
  const ahead=Math.atan2(Math.sin(heading),Math.cos(heading));
  const arrow=Math.abs(ahead)<.45?'↑':ahead>0?(ahead<2.6?'↗':'↓'):(ahead> -2.6?'↖':'↓');
  wayfinder.textContent=arrow+' '+(nextTarget.label||'SIGNAL FRAGMENT');
  metric.textContent=Math.round(Math.hypot(dx,dz))+' M';
 }else{wayfinder.textContent='◇ SYSTEM AT REST';metric.textContent='COMPLETE';}
 if(mapOpen)atlas.refresh();
 const localLandmark=openWorld.landmarks.find(p=>Math.hypot(camera.position.x-p.x,camera.position.z-p.z)<p.r);
 document.querySelector('#location').textContent=localLandmark?.name||(camera.position.z < -205?'HEART OF THE GROVE':camera.position.z < -110?'THE SIMULATION FOREST':camera.position.z < -70?'THE SOURCE NODE':camera.position.z < -10?'THE CONSTRUCT CITY':'THE AWAKENING');
 frameCount++;if(t-lastFps>1){document.querySelector('#fps').textContent=Math.round(frameCount/(t-lastFps))+' FPS';frameCount=0;lastFps=t;}
 renderer.render(scene,camera);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.5)*qualityScale);});
tick();
