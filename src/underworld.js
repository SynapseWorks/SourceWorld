import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';
import {
 DEEP_FLOOR,DEEP_EYE,DEEP_RADIUS,DEEP_ROOMS,STRATA_STAGES,
 STARTER_CAVERNS,cavernsNear,cavernAtSurface,withinCaveBounds,validCaveState,
 isValidStrataId,cavePalette
} from './underworldData.js';

// The Living Underworld: deterministic caves are ephemeral meshes, while irrigation,
// fungal care and discoveries persist by cavern-node identity.
export function createUnderworld(scene,{onEvent=()=>{},onEffect=()=>{}}={}){
 const caveRoot=new THREE.Group();caveRoot.name='Deep strata · active cave';
 caveRoot.visible=false;scene.add(caveRoot);
 const portalsRoot=new THREE.Group();portalsRoot.name='Wireframe gateways and surface springs';
 scene.add(portalsRoot);
 const rockCode=matrixMaterial(15,20,.72,4081,'stone');
 const rootCode=matrixMaterial(16,17,.87,4082,'bark');
 const fungiCode=matrixMaterial(17,18,1.18,4083,'foliage');
 const crystalCode=matrixMaterial(16,22,1.36,4084,'crystal');
 const waterCode=new THREE.MeshBasicMaterial({color:'#70d7bd',transparent:true,opacity:.45,side:THREE.DoubleSide,depthWrite:false});
 const waterAnime=new THREE.MeshToonMaterial({color:'#7dc4cc',transparent:true,opacity:.34,side:THREE.DoubleSide,depthWrite:false});
 const paletteMaterials=new Map();
 function animeMat(color){
  if(!paletteMaterials.has(color))paletteMaterials.set(color,new THREE.MeshToonMaterial({
   color,flatShading:true,side:THREE.DoubleSide
  }));
  return paletteMaterials.get(color);
 }
 const glow=new THREE.MeshBasicMaterial({color:'#7decba',transparent:true,opacity:.71,depthWrite:false});
 const sharedRing=new THREE.TorusGeometry(2,.08,6,48);
 const sharedCrystal=new THREE.OctahedronGeometry(1,0);
 const sharedCone=new THREE.ConeGeometry(1,1,7);
 const sharedMushroom=new THREE.CylinderGeometry(.12,.18,1,6);
 const circle=new THREE.CircleGeometry(1,52);
 const portalPool=Array.from({length:15},(_,i)=>{
  const group=new THREE.Group();group.name='Hidden seam '+i;portalsRoot.add(group);
  const arch=new THREE.Mesh(sharedRing,glow);
  arch.rotation.x=-.08;arch.position.y=1.35;group.add(arch);
  const core=new THREE.Mesh(sharedCrystal,crystalCode);
  core.position.y=1.3;core.scale.set(.44,.68,.44);group.add(core);
  const halo=new THREE.Mesh(new THREE.RingGeometry(1.7,2.3,48),
   new THREE.MeshBasicMaterial({color:'#70d8ad',transparent:true,opacity:.19,
    depthWrite:false,side:THREE.DoubleSide}));
  halo.rotation.x=-Math.PI/2;halo.position.y=.09;group.add(halo);
  // Consequences remain visible across Code and Anime realities.
  const spring=new THREE.Group();portalsRoot.add(spring);
  const lake=new THREE.Mesh(circle,waterCode.clone());lake.rotation.x=-Math.PI/2;
  lake.scale.set(5,3.8,1);lake.position.y=.12;spring.add(lake);
  for(let j=0;j<9;j++){
   const a=j*2.39996,r=2.8+(j%3)*.8;
   const shoot=new THREE.Mesh(sharedCone,fungiCode);
   shoot.position.set(Math.cos(a)*r,.37,Math.sin(a)*r);
   shoot.scale.set(.19,.6+(j%3)*.3,.24);spring.add(shoot);
  }
  const center=new THREE.Mesh(sharedCrystal,crystalCode);
  center.position.set(0,1.9,0);center.scale.set(.5,.8,.5);spring.add(center);
  group.visible=false;spring.visible=false;
  return {group,spring,lake,core,halo,id:null};
 });
 const saved=new Map(),discovered=new Set();
 let active=null,inside=false,renderAnime=false,clock=0;
 let lastRefreshX=Infinity,lastRefreshZ=Infinity,oldWireframe=false;
 let cave=null,localFungi=null,animeFungi=null,caveWater=null,spores=null;
 const disposables=[];
 const safe=(n,d=0)=>Number.isFinite(n)?n:d;
 const state=(id)=>{
  if(!saved.has(id))saved.set(id,validCaveState());
  return saved.get(id);
 };
 const randFor=id=>{
  let n=2166136261;
  for(const c of id){n=Math.imul(n^c.charCodeAt(0),16777619);}
  return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};
 };
 function mesh(parent,geo,mat,x=0,y=0,z=0){
  const item=new THREE.Mesh(geo,mat);item.position.set(x,y,z);parent.add(item);return item;
 }
 function bodyBox(parent,x,y,z,w,h,d,material){
  const item=mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);
  disposables.push(item.geometry);return item;
 }
 function ring(parent,x,y,z,r,mat,rotation=-Math.PI/2){
  const item=mesh(parent,new THREE.TorusGeometry(r,.068,5,42),mat,x,y,z);
  item.rotation.x=rotation;disposables.push(item.geometry);return item;
 }
 function refreshGrowth(){
  if(!active||!cave)return;
  const data=state(active.id);
  const scale=1+Math.min(1,data.care/6)*.52+data.flow*.12;
  if(localFungi)localFungi.scale.setScalar(scale);
  if(animeFungi)animeFungi.scale.setScalar(scale);
  if(caveWater){
   caveWater.code.visible=!renderAnime&&data.flow>0;
   caveWater.anime.visible=renderAnime&&data.flow>0;
   caveWater.source.visible=true;
   caveWater.code.material.opacity=.12+data.flow*.12;
   caveWater.anime.material.opacity=.10+data.flow*.12;
  }
  const node=cave.nexus;
  if(node)node.scale.setScalar(.92+data.flow*.14);
 }
 function clearCave(){
  if(caveWater){caveWater.material.dispose();caveWater.animeMaterial.dispose();}
  if(spores)spores.material.dispose();
  caveRoot.clear();cave=null;localFungi=null;animeFungi=null;caveWater=null;spores=null;
  for(const g of disposables)g.dispose();disposables.length=0;
 }
 function spawnCave(node){
  clearCave();active=node;
  const pal=cavePalette(node.type),random=randFor(node.id);
  const group=new THREE.Group();group.position.set(node.x,DEEP_FLOOR,node.z);
  caveRoot.add(group);
  const stoneAnime=animeMat(pal.stone),fungiAnimeMat=animeMat(pal.fungus);
  const floor=mesh(group,new THREE.CylinderGeometry(DEEP_RADIUS,DEEP_RADIUS,1,56),rockCode,0,-.52,0);
  disposables.push(floor.geometry);
  // An overhead slab encloses the chamber, but leaves enough clear vertical
  // space for first-person looking and for visual recognition of the caverns.
  const ceiling=mesh(group,new THREE.CylinderGeometry(DEEP_RADIUS-1,DEEP_RADIUS-2,1.8,48),
   rockCode,0,15.6,0);
  disposables.push(ceiling.geometry);
  const animeFloor=mesh(group,new THREE.CylinderGeometry(DEEP_RADIUS+.04,DEEP_RADIUS+.04,1.02,56),
    stoneAnime,0,-.51,0);
  disposables.push(animeFloor.geometry);
  // A linked chamber plan. No invisible internal collider blocks the routes.
  const rooms=Object.values(DEEP_ROOMS);
  const paths=[];
  for(const room of rooms){
   if(room===DEEP_ROOMS.exit)continue;
   const length=Math.hypot(room.x,room.z);
   const path=bodyBox(group,room.x*.5,.016,room.z*.5,5.2,.12,length,
      rootCode);
   path.rotation.y=-Math.atan2(room.x,room.z);
   paths.push(path);
   const subtle=ring(group,room.x,.13,room.z,room.r+1.2,glow);
   subtle.material=glow;
  }
  // Ringed exterior rock columns and stalactites create a legible cave edge.
  const stoneGeo=new THREE.DodecahedronGeometry(1,0);
  const spikes=new THREE.InstancedMesh(stoneGeo,rockCode,68);
  const animeSpikes=new THREE.InstancedMesh(stoneGeo,stoneAnime,68);
  const dummy=new THREE.Object3D();
  for(let i=0;i<68;i++){
   const angle=(i+.2*random())*Math.PI*2/68;
   const rr=36+random()*8;
   const height=3+random()*9;
   dummy.position.set(Math.cos(angle)*rr,height*.37-.15,Math.sin(angle)*rr);
   dummy.rotation.set(random()*.2,random()*6.283,random()*.24);
   dummy.scale.set(.8+random()*2,height*.56,.8+random()*1.5);
   dummy.updateMatrix();spikes.setMatrixAt(i,dummy.matrix);
   animeSpikes.setMatrixAt(i,dummy.matrix);
  }
  spikes.instanceMatrix.needsUpdate=true;animeSpikes.instanceMatrix.needsUpdate=true;
  spikes.frustumCulled=false;animeSpikes.frustumCulled=false;
  group.add(spikes,animeSpikes);
  disposables.push(stoneGeo);
  // Actual underground mycelium: clustered stems and caps, biome-coloured,
  // concentrated away from the center and navigable room paths.
  const count=46,stemGeo=new THREE.CylinderGeometry(.11,.21,1,6);
  const capGeo=new THREE.ConeGeometry(1,.84,8);
  const stemCode=new THREE.InstancedMesh(stemGeo,rootCode,count);
  const stemAnime=new THREE.InstancedMesh(stemGeo,animeMat('#a9a59a'),count);
  const capCode=new THREE.InstancedMesh(capGeo,fungiCode,count);
  const capAnime=new THREE.InstancedMesh(capGeo,fungiAnimeMat,count);
  for(let i=0;i<count;i++){
   const angle=i*2.39996,rr=18+random()*15,x=Math.cos(angle)*rr,z=Math.sin(angle)*rr;
   const h=.8+random()*2.35,w=.6+random()*.9;
   dummy.position.set(x,h*.48,z);dummy.rotation.set(0,random()*6.28,0);
   dummy.scale.set(.45,h,.45);dummy.updateMatrix();
   stemCode.setMatrixAt(i,dummy.matrix);stemAnime.setMatrixAt(i,dummy.matrix);
   dummy.position.y=h+.3;dummy.scale.set(w,.65+random()*.42,w);
   dummy.updateMatrix();capCode.setMatrixAt(i,dummy.matrix);capAnime.setMatrixAt(i,dummy.matrix);
  }
  for(const item of [stemCode,stemAnime,capCode,capAnime]){
   item.instanceMatrix.needsUpdate=true;item.frustumCulled=false;
  }
  localFungi=new THREE.Group();localFungi.add(stemCode,capCode);group.add(localFungi);
  animeFungi=new THREE.Group();animeFungi.add(stemAnime,capAnime);group.add(animeFungi);
  disposables.push(stemGeo,capGeo);
  // Underground pool, springs and water channels: views share geometry, with
  // adjustable flow stages; editing this aquifer changes the ground above.
  const waterRoot=new THREE.Group();group.add(waterRoot);
  const waterMat=waterCode.clone(),animeWaterMat=waterAnime.clone();
  const streamGroup=new THREE.Group();group.add(streamGroup);
  const paintedStream=new THREE.Group();group.add(paintedStream);
  const channelPoints=[[0,0],[6,-4],[11,-8],[16,-12]];
  for(let i=1;i<channelPoints.length;i++){
   const [ax,az]=channelPoints[i-1],[bx,bz]=channelPoints[i];
   const cx=(ax+bx)/2,cz=(az+bz)/2,len=Math.hypot(bx-ax,bz-az);
   const strip=bodyBox(streamGroup,cx,.115,cz,2.1,.06,len+.5,waterMat);
   strip.rotation.y=-Math.atan2(bx-ax,bz-az);
   const alt=bodyBox(paintedStream,cx,.12,cz,2.1,.064,len+.5,animeWaterMat);
   alt.rotation.y=strip.rotation.y;
  }
  const pool=mesh(waterRoot,circle,waterMat,DEEP_ROOMS.aquifer.x,.16,DEEP_ROOMS.aquifer.z);
  pool.rotation.x=-Math.PI/2;pool.scale.set(6.5,4.4,1);
  const animePool=mesh(waterRoot,circle,animeWaterMat,DEEP_ROOMS.aquifer.x,.17,DEEP_ROOMS.aquifer.z);
  animePool.rotation.x=-Math.PI/2;animePool.scale.set(6.5,4.4,1);
  caveWater={code:streamGroup,anime:paintedStream,source:waterRoot,
    material:waterMat,animeMaterial:animeWaterMat};
  // Three gently recognizable activities: exit, irrigation nexus, fungal nursery.
  const exit=mesh(group,sharedCrystal,crystalCode,DEEP_ROOMS.exit.x,1.3,DEEP_ROOMS.exit.z);
  exit.scale.set(.48,.65,.48);
  ring(group,DEEP_ROOMS.exit.x,.18,DEEP_ROOMS.exit.z,2.3,glow);
  const nexus=mesh(group,new THREE.IcosahedronGeometry(1.75,1),crystalCode,
   DEEP_ROOMS.aquifer.x,3.5,DEEP_ROOMS.aquifer.z);
  disposables.push(nexus.geometry);
  const nursery=mesh(group,new THREE.DodecahedronGeometry(1.2,1),fungiCode,
   DEEP_ROOMS.nursery.x,1.8,DEEP_ROOMS.nursery.z);
  disposables.push(nursery.geometry);
  ring(group,DEEP_ROOMS.nursery.x,.16,DEEP_ROOMS.nursery.z,2.6,glow);
  // Large signature sculpture by biome; landmarks remain below the roof.
  for(let i=0;i<4;i++){
   const a=i*1.57,rr=5+random()*3;
   const monolith=mesh(group,sharedCrystal,i%2?crystalCode:rootCode,
    DEEP_ROOMS.listening.x+Math.cos(a)*rr,
    3+random()*2,DEEP_ROOMS.listening.z+Math.sin(a)*rr);
   monolith.scale.set(.6,2.4,.6);
  }
  // Every biome has a different structure to read in silhouette, not simply
  // a different hue. All pieces stay clear of the three walkable activity rooms.
  const grammar=new THREE.Group();grammar.name=node.type+' cave formation';group.add(grammar);
  const signature=[
   {x:-28,z:17},{x:-24,z:22},{x:27,z:18},{x:30,z:12},
   {x:-7,z:-30},{x:4,z:-33}
  ];
  for(const [i,pos] of signature.entries()){
   if(node.type==='mosslight'){
    const stem=mesh(grammar,sharedCone,rootCode,pos.x,9.5,pos.z);
    stem.rotation.z=.16*(i%2?1:-1);stem.scale.set(.48,6.5+(i%3),.52);
    const leaf=mesh(grammar,sharedCrystal,fungiCode,pos.x,2.7,pos.z);
    leaf.scale.set(.9,.7,.9);
   }else if(node.type==='glassfall'){
    const glass=mesh(grammar,sharedCrystal,crystalCode,pos.x,4.2,pos.z);
    glass.scale.set(.9+(i%3)*.3,3.2+(i%4),.8);glass.rotation.z=i*.13;
   }else if(node.type==='siltreed'){
    for(let j=0;j<4;j++){
     const reed=mesh(grammar,sharedCone,j%2?rootCode:fungiCode,
       pos.x+(j-1.5)*.6,2.2+(j%2)*.4,pos.z+(j%3)*.35);
     reed.scale.set(.17,4.4+(j%3)*.7,.17);
    }
   }else if(node.type==='amber'){
    for(let j=0;j<3;j++){
     const amber=mesh(grammar,sharedCrystal,crystalCode,
       pos.x+(j-1)*.9,2+(j%2),pos.z);
     amber.scale.set(.54,1.8+(j%3)*.5,.62);
    }
   }else{
    const rib=mesh(grammar,sharedCrystal,rockCode,pos.x,5.8,pos.z);
    rib.scale.set(.62,4.3,.72);rib.rotation.z=i%2?.22:-.22;
   }
  }
  // Bioluminescent spores drift in a tiny bounded pool and are reduced-motion safe.
  const sporeGeometry=new THREE.IcosahedronGeometry(.12,0);
  const sporeMaterial=new THREE.MeshBasicMaterial({
   color:pal.fungus,transparent:true,opacity:.68,depthWrite:false
  });
  const sporeMesh=new THREE.InstancedMesh(sporeGeometry,sporeMaterial,24);
  const sporeSeeds=Array.from({length:24},(_,i)=>({
   x:(random()-.5)*52,z:(random()-.5)*52,
   y:2+random()*9,phase:random()*6.283
  }));
  const dummySpore=new THREE.Object3D();
  for(const [i,item] of sporeSeeds.entries()){
   dummySpore.position.set(item.x,item.y,item.z);
   dummySpore.scale.setScalar(.5+(i%3)*.25);dummySpore.updateMatrix();
   sporeMesh.setMatrixAt(i,dummySpore.matrix);
  }
  sporeMesh.instanceMatrix.needsUpdate=true;sporeMesh.frustumCulled=false;
  group.add(sporeMesh);disposables.push(sporeGeometry);
  spores={mesh:sporeMesh,seeds:sporeSeeds,dummy:dummySpore,material:sporeMaterial};
  cave={group,nexus,waterMat,animeWaterMat,stone:spikes,animeStone:animeSpikes,
   normalFloor:floor,paintedFloor:animeFloor};
  setAnime(renderAnime);refreshGrowth();
 }
 function setAnime(enabled){
  renderAnime=Boolean(enabled);
  if(!cave)return;
  cave.stone.visible=!renderAnime;cave.animeStone.visible=renderAnime;
  cave.normalFloor.visible=!renderAnime;cave.paintedFloor.visible=renderAnime;
  localFungi.visible=!renderAnime;animeFungi.visible=renderAnime;
  caveWater.code.visible=!renderAnime&&state(active.id).flow>0;
  caveWater.anime.visible=renderAnime&&state(active.id).flow>0;
 }
 function setWireframe(value){
  if(!value&&inside)leave(false);
  lastRefreshX=Infinity;oldWireframe=!value;
 }
 function refreshSurface(player,wireframe){
  const all=cavernsNear(player.x,player.z,205);
  for(let i=0;i<portalPool.length;i++){
   const slot=portalPool[i],entry=all[i];
   if(!entry){slot.group.visible=false;slot.spring.visible=false;slot.id=null;continue;}
   const data=saved.get(entry.id);
   slot.group.visible=Boolean(wireframe&&!inside&&player.y>-.5&&player.y<10);
   slot.group.position.set(entry.x,0,entry.z);
   slot.spring.visible=Boolean(data?.flow>0&&!inside&&player.y>-.5&&player.y<20);
   slot.spring.position.set(entry.x,0,entry.z);
   slot.spring.scale.setScalar(.75+(data?.flow||0)*.16);
   slot.lake.material.opacity=.07+(data?.flow||0)*.085;
   slot.id=entry.id;
  }
 }
 function restore(snapshot={}){
  saved.clear();discovered.clear();
  if(snapshot&&typeof snapshot==='object'){
   if(Array.isArray(snapshot.nodes)){
    for(const [id,data] of snapshot.nodes.slice(-160)){
     if(isValidStrataId(id)&&data&&typeof data==='object')saved.set(id,validCaveState(data));
    }
   }
   if(Array.isArray(snapshot.discovered)){
    for(const id of snapshot.discovered.slice(-160))if(isValidStrataId(id))discovered.add(id);
   }
  }
  lastRefreshX=Infinity;
  return true;
 }
 function snapshot(){
  return {nodes:[...saved.entries()].slice(-160).map(([id,data])=>[id,{...data}]),
   discovered:[...discovered].slice(-160)};
 }
 function nearGate(pos,wireframe){
  if(inside){
   const x=pos.x-active.x,z=pos.z-active.z;
   if(Math.hypot(x-DEEP_ROOMS.exit.x,z-DEEP_ROOMS.exit.z)<DEEP_ROOMS.exit.r)return 'exit';
   if(Math.hypot(x-DEEP_ROOMS.aquifer.x,z-DEEP_ROOMS.aquifer.z)<DEEP_ROOMS.aquifer.r)return 'rewrite';
   if(Math.hypot(x-DEEP_ROOMS.nursery.x,z-DEEP_ROOMS.nursery.z)<DEEP_ROOMS.nursery.r)return 'tend';
   if(Math.hypot(x-DEEP_ROOMS.listening.x,z-DEEP_ROOMS.listening.z)<DEEP_ROOMS.listening.r)return 'listen';
   return null;
  }
  return cavernAtSurface(pos,wireframe)?'enter':null;
 }
 function interact(pos,wireframe,day=1){
  const action=nearGate(pos,wireframe);if(!action)return null;
  if(action==='enter'){
   const selected=cavernAtSurface(pos,wireframe);
   if(!selected)return null;
   inside=true;spawnCave(selected);caveRoot.visible=true;
   const first=!discovered.has(selected.id);
   discovered.add(selected.id);
   const event={type:'enter',id:selected.id,title:selected.name,first,
    x:selected.x,y:DEEP_EYE,z:selected.z+11.2};
   if(first)onEvent({type:'SUBTERRANEAN DISCOVERY',title:selected.name,
    description:selected.story,id:selected.id});
   return event;
  }
  if(action==='exit'){
   return leave(true);
  }
  if(action==='listen'){
   const data=state(active.id);
   const first=data.lastListenDay!==day;
   if(first)data.lastListenDay=day;
   const description=active.story+' The aquifer is '+STRATA_STAGES[data.flow].label.toLowerCase()+
    ', and the fungal nursery has been tended '+data.care+' times. The world below remembers.';
   if(first)onEvent({type:'UNDERGROUND OBSERVATION',title:active.name+' · LISTENING CHAMBER',
    description});
   return {type:'listen',title:'THE STONE IS LISTENING',description,first};
  }
  const data=state(active.id);
  if(action==='rewrite'){
   const previous=data.flow;
   data.flow=(data.flow+1)%STRATA_STAGES.length;
   const stage=STRATA_STAGES[data.flow];
   const eligible=data.flow>previous&&data.lastEffectDay!==day;
   if(eligible)data.lastEffectDay=day;
   refreshGrowth();
   const event={type:'rewrite',title:stage.label,description:stage.description,
    id:active.id,x:active.x,z:active.z,flow:data.flow,previous,
    strength:eligible ? (.026+data.flow*.007) : 0,day};
   onEvent({type:'SUBTERRANEAN REWRITE',title:active.name+' · '+stage.label,
    description:stage.description});
   if(eligible)onEffect(event);
   return event;
  }
  if(action==='tend'){
   if(data.lastCareDay===day)return {type:'already-tended',title:'THE FUNGAL NURSERY',day};
   data.lastCareDay=day;data.care=Math.min(30,data.care+1);
   refreshGrowth();
   const event={type:'tend',title:'THE FUNGAL NURSERY',id:active.id,
    x:active.x,z:active.z,flow:data.flow,care:data.care,strength:.012,day};
   onEvent({type:'UNDERGROUND CARE',title:active.name+' · '+event.title,
    description:'The mycelium has been tended. Its threads carry nourishment through the rock.'});
   onEffect(event);
   return event;
  }
  return null;
 }
 function leave(announce=false){
  if(!inside||!active)return null;
  const selected=active;
  inside=false;caveRoot.visible=false;clearCave();active=null;
  lastRefreshX=Infinity;
  return {type:'exit',title:'BACK ABOVE '+selected.name,x:selected.x,y:1.72,z:selected.z};
 }
 function bounds(x,z){
  return inside&&active&&withinCaveBounds(x-active.x,z-active.z);
 }
 function update(t,dt,pos,{wireframe=false,reduced=false,paused=false}={}){
  clock=t;
  // Gates are pooled; just 15 sets of meshes even after an enormous walk.
  if((Math.hypot(pos.x-lastRefreshX,pos.z-lastRefreshZ)>20)||oldWireframe!==wireframe){
   lastRefreshX=pos.x;lastRefreshZ=pos.z;oldWireframe=wireframe;
   refreshSurface(pos,wireframe);
  }
  if(!paused&&inside&&cave&&!reduced){
   cave.nexus.rotation.y+=dt*.14;
   if(spores){
    const d=spores.dummy;
    for(const [i,item] of spores.seeds.entries()){
     d.position.set(item.x+Math.sin(t*.25+item.phase)*.7,
      item.y+Math.sin(t*.62+item.phase)*.8,
      item.z+Math.cos(t*.18+item.phase)*.55);
     d.scale.setScalar(.50+(i%3)*.25);d.updateMatrix();
     spores.mesh.setMatrixAt(i,d.matrix);
    }
    spores.mesh.instanceMatrix.needsUpdate=true;
   }
   // Water flows only when the lower pathways have been restored.
   if(caveWater&&state(active.id).flow>0){
    caveWater.material.opacity=.10+state(active.id).flow*.12+
      Math.sin(t*.62)*.018;
    caveWater.animeMaterial.opacity=.10+state(active.id).flow*.12+
      Math.sin(t*.62)*.018;
   }
  }
  return {inside,active,action:nearGate(pos,wireframe),count:saved.size};
 }
 function dispose(){
  clearCave();scene.remove(caveRoot,portalsRoot);
  for(const slot of portalPool){
   slot.lake.material.dispose();slot.halo.material.dispose();
  }
  for(const mat of paletteMaterials.values())mat.dispose();
  for(const mat of [rockCode,rootCode,fungiCode,crystalCode,waterCode,waterAnime,glow])mat.dispose();
  for(const g of [sharedRing,sharedCrystal,sharedCone,sharedMushroom,circle])g.dispose();
 }
 return {nearGate,interact,restore,snapshot,update,dispose,leave,setWireframe,setAnime,
  bounds,cavernsNear,getDiscovered:()=>[...discovered],
  getState:(id)=>({... (saved.get(id)||validCaveState())}),
  get inside(){return inside;},get active(){return active;},
  get floorEye(){return DEEP_EYE;}};
}
