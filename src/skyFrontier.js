import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';
import {skyIslandsNear,skyIslandsForNode,isSkyFrontierId,skyIslandClimate,
 MAX_STREAMED_SKY_ISLANDS,SKY_NODE_SPACING} from './skyFrontierData.js';

// Bounded, disposable visuals backed by stable biome-node identities.
// Care and discoveries persist; generated meshes never enter the save file.
export function createSkyFrontier(scene,{onDiscover=()=>{},onCare=()=>{}}={}){
 const chunks=new Map(),discovered=new Set(),care=new Map();
 const root=new THREE.Group();root.name='Generated biome sky archipelago';scene.add(root);
 const materials={
  codeStone:matrixMaterial(12,19,.84,13191,'stone'),
  codePlant:matrixMaterial(15,16,.9,13194,'foliage'),
  codeLight:matrixMaterial(19,22,1.6,13196,'crystal'),
  wind:new THREE.MeshBasicMaterial({color:'#b5ffe1',transparent:true,opacity:.19,depthWrite:false,side:THREE.DoubleSide}),
  landing:new THREE.MeshBasicMaterial({color:'#d7f8ec',transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide})
 };
 const animeByBiome=new Map(),shared={
  base:new THREE.CylinderGeometry(1,.73,1.6,10),
  rock:new THREE.ConeGeometry(.92,2.2,7),
  plant:new THREE.ConeGeometry(.35,1.05,6),
  gem:new THREE.IcosahedronGeometry(.52,0),
  ring:new THREE.TorusGeometry(1,.035,4,44,Math.PI*1.8),
  halo:new THREE.RingGeometry(.71,.75,40)
 };
 const dummy=new THREE.Object3D();
 let anime=false,wireframe=false,quality=1,elapsed=0,lastCell='',lastCheck=0,latestPhase=.5,latestWeather='STABLE';
 function isSafeId(id){
  if(!isSkyFrontierId(id))return false;
  const [,nx,nz,slot]=/^skyfrontier:(-?\d+):(-?\d+):([01])$/.exec(id);
  // Only store identities from the authored deterministic generator.
  return skyIslandsForNode(Number(nx),Number(nz)).some(s=>s.slot===Number(slot));
 }
 function visualMaterials(data){
  if(!animeByBiome.has(data.biome)){
   const sky=new THREE.MeshToonMaterial({color:data.palette,flatShading:true});
   const leaf=new THREE.MeshToonMaterial({color:data.accent,side:THREE.DoubleSide});
   const stone=new THREE.MeshToonMaterial({color:data.palette,flatShading:true});
   animeByBiome.set(data.biome,{sky,leaf,stone});
  }
  return animeByBiome.get(data.biome);
 }
 function addIsland(data){
  const group=new THREE.Group();group.name='Sky node '+data.id;
  group.position.set(data.x,data.y,data.z);root.add(group);
  const pretty=visualMaterials(data);
  const mesh=(geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{
   const item=new THREE.Mesh(geometry,material);
   item.position.set(x,y,z);item.scale.set(sx,sy,sz);
   item.userData.noWireframe=false;
   group.add(item);return item;
  };
  const base=mesh(shared.base,anime?pretty.stone:materials.codeStone,0,-.81,0,data.r,1,data.r);
  const rock=mesh(shared.rock,anime?pretty.stone:materials.codeStone,0,-2.9,0,data.r*.51,2.5,data.r*.51);
  rock.rotation.y=(data.nx+data.nz)*.37;
  const landmark=mesh(shared.gem,anime?pretty.leaf:materials.codeLight,0,2.2,0,
   data.biome==='glassfall'?1.75:.82,data.biome==='glassfall'?2.8:1.4,
   data.biome==='glassfall'?1.75:.82);
  // Instanced vegetation holds individual blades in a single draw call.
  const flora=new THREE.InstancedMesh(shared.plant,anime?pretty.leaf:materials.codePlant,data.flora);
  const n=data.flora;
  for(let i=0;i<n;i++){
   const a=i*2.399963+data.slot,rad=data.r*(.41+.35*((i*7%11)/11));
   dummy.position.set(Math.cos(a)*rad,.36,Math.sin(a)*rad);
   dummy.rotation.set(0,a,0);dummy.scale.set(.66,1+(i%4)*.32,.7);
   dummy.updateMatrix();flora.setMatrixAt(i,dummy.matrix);
  }
  flora.instanceMatrix.needsUpdate=true;flora.frustumCulled=false;
  if(quality<=.7)flora.count=Math.ceil(data.flora*.46);
  group.add(flora);
  const wind=mesh(shared.ring,materials.wind,0,9.4,0,8,8,8);
  wind.rotation.x=Math.PI/2;wind.userData.noWireframe=true;
  const halo=mesh(shared.halo,materials.landing,0,.044,0,data.r*.8,1,data.r*.8);
  halo.rotation.x=-Math.PI/2;halo.userData.noWireframe=true;
  const bud=mesh(shared.gem,anime?pretty.leaf:materials.codeLight,2.1,1.3,0,.8,1.2,.8);
  if(wireframe&&anime)for(const item of [base,rock,landmark,flora,bud])item.material.wireframe=true;
  const entry={data,group,base,rock,landmark,flora,wind,halo,bud,pretty};
  chunks.set(data.id,entry);
  return entry;
 }
 function unload(id){
  const entry=chunks.get(id);if(!entry)return;
  root.remove(entry.group);
  // All geometries and materials are shared; no per-chunk GPU disposal is necessary.
  chunks.delete(id);
 }
 function stream(x,z){
  const chosen=skyIslandsNear(x,z);
  const wanted=new Set(chosen.map(s=>s.id));
  for(const island of chosen)if(!chunks.has(island.id))addIsland(island);
  for(const id of [...chunks.keys()])if(!wanted.has(id))unload(id);
  lastCell=Math.floor(x/SKY_NODE_SPACING)+':'+Math.floor(z/SKY_NODE_SPACING);
  return chosen;
 }
 function restore(state={}){
  for(const id of Array.isArray(state.discovered)?state.discovered.slice(-450):[])
   if(isSafeId(id))discovered.add(id);
  const entries=state.care&&typeof state.care==='object'?Object.entries(state.care).slice(-400):[];
  for(const [id,record] of entries){
   if(!isSafeId(id)||typeof record!=='object'||!record)continue;
   const total=Number.isFinite(record.total)?Math.max(0,Math.min(100,Math.floor(record.total))):0;
   const day=Number.isFinite(record.day)?Math.max(0,Math.floor(record.day)):0;
   if(total)care.set(id,{day,total});
  }
 }
 function snapshot(){
  return {discovered:[...discovered].slice(-450),
   care:Object.fromEntries([...care].slice(-400).map(([id,item])=>[id,{...item}]))};
 }
 function getDiscovered(){
  return [...discovered].map(id=>{
   const match=/^skyfrontier:(-?\d+):(-?\d+):([01])$/.exec(id);
   return match?skyIslandsForNode(Number(match[1]),Number(match[2]))[Number(match[3])]||null:null;
  }).filter(Boolean);
 }
 function getNearby(position,day=1){
  for(const item of chunks.values()){
   const d=item.data;
   if(Math.hypot(position.x-d.x,position.z-d.z)>3.7)continue;
   if(Math.abs(position.y-(d.y+1.72))>3.3)continue;
   if(care.get(d.id)?.day===day)continue;
   return d;
  }
  return null;
 }
 function interact(position,day=1){
  const d=getNearby(position,day);if(!d)return false;
  const previous=care.get(d.id)||{total:0,day:0};
  const total=Math.min(100,previous.total+1);
  care.set(d.id,{total,day});
  const event={type:'SKY CARE',title:'TENDED · '+d.name,
   description:'The floating garden is healthier. Migrating wildlife will return to its roots.',
   id:d.id,x:d.x,z:d.z,y:d.y,careCount:total,biome:d.biome};
  onCare(event);
  return event;
 }
 function floorEyeAt(x,z,y,eyeHeight=1.72){
  let floor=eyeHeight;
  for(const item of chunks.values()){
   const d=item.data;
   if(Math.hypot(x-d.x,z-d.z)<d.r*.72&&y>=d.y+eyeHeight-.35)
    floor=Math.max(floor,d.y+eyeHeight);
  }
  return floor;
 }
 function updraftAt(position){
  let lift=0;
  for(const item of chunks.values()){
   const d=item.data;
   const horizontal=Math.hypot(position.x-d.x,position.z-d.z);
   const vertical=Math.abs(position.y-(d.y+11));
   if(horizontal<22&&vertical<25)lift=Math.max(lift,
    (1-horizontal/22)*(1-vertical/25)*11);
  }
  return lift;
 }
 function setAnime(enabled){
  anime=Boolean(enabled);
  for(const item of chunks.values()){
   item.base.material=item.rock.material=anime?item.pretty.stone:materials.codeStone;
   item.flora.material=item.bud.material=anime?item.pretty.leaf:materials.codePlant;
   item.landmark.material=anime?item.pretty.leaf:materials.codeLight;
  }
 }
 function setWireframe(enabled){
  wireframe=Boolean(enabled);
  for(const item of chunks.values()){
   // Never mutate the shared global code shader material, which would
   // inadvertently change every surface in the constructed world.
   for(const node of [item.base,item.rock,item.flora,item.bud,item.landmark])
    if(node.material!==materials.codeStone&&node.material!==materials.codeLight&&
       node.material!==materials.codePlant)node.material.wireframe=wireframe;
  }
 }
 function setQuality(value){quality=Number.isFinite(value)?value:1;
  for(const entry of chunks.values())
   entry.flora.count=quality<=.7?Math.ceil(entry.data.flora*.46):entry.data.flora;
 }
 function update(dt,player,{time=0,phase=.5,weather='STABLE',day=1,
  paused=false,reduced=false,active=false}={}){
  elapsed+=Math.min(dt,.06);
  latestPhase=phase;latestWeather=weather;
  const cell=Math.floor(player.x/SKY_NODE_SPACING)+':'+Math.floor(player.z/SKY_NODE_SPACING);
  if(active&&(!lastCell||cell!==lastCell||elapsed-lastCheck>.9)){
   stream(player.x,player.z);lastCheck=elapsed;
  }
  let near=null,nearDistance=Infinity;
  for(const entry of chunks.values()){
   const d=entry.data;
   const horizontal=Math.hypot(player.x-d.x,player.z-d.z);
   entry.group.visible=horizontal<250&&Math.abs(player.y-d.y)<140;
   if(!entry.group.visible)continue;
   const climate=skyIslandClimate(d,phase,weather,care.get(d.id)?.total||0);
   // Time, weather and care cause change even when players are elsewhere.
   const growth=.64+climate.flower*.50;
   entry.flora.scale.setScalar(growth);
   entry.bud.scale.setScalar(.68+Math.min(.6,(care.get(d.id)?.total||0)*.055)+climate.flower*.19);
   entry.wind.visible=climate.wetness<.94;
   if(!reduced&&!paused){
    entry.landmark.rotation.y+=dt*.17;
    entry.wind.rotation.z+=dt*.08;
   }
   if(active&&!paused&&horizontal<28&&Math.abs(player.y-d.y)<31){
    if(!discovered.has(d.id)){
     discovered.add(d.id);
     onDiscover({...d,type:'PROCEDURAL SKY',description:d.story});
    }
    if(horizontal<nearDistance){near=d;nearDistance=horizontal;}
   }
  }
  return {nearby:getNearby(player,day),site:near,generated:chunks.size,
   charted:discovered.size};
 }
 function dispose(){
  for(const id of [...chunks.keys()])unload(id);
  scene.remove(root);
  Object.values(shared).forEach(g=>g.dispose());
  Object.values(materials).forEach(m=>m.dispose());
  for(const set of animeByBiome.values())Object.values(set).forEach(m=>m.dispose());
 }
 return {update,restore,snapshot,getDiscovered,stream,interact,getNearby,
  floorEyeAt,updraftAt,setAnime,setWireframe,setQuality,getStats:()=>({
   active:chunks.size,discovered:discovered.size,caredFor:care.size,max:MAX_STREAMED_SKY_ISLANDS
  }),getActiveIslands:()=>[...chunks.values()].map(c=>{
   const amount=care.get(c.data.id)?.total||0;
   return {...c.data,care:amount,
    birdInterest:skyIslandClimate(c.data,latestPhase,latestWeather,amount).birdInterest};
  }),dispose};
}
