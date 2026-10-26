import * as THREE from 'three';
import {NEST_STAGES,SEEDFALL_INTERVAL,nestLife,seedfallForTick,validNestId} from './skyEcologyData.js';
import {SKY_SITES} from './skyRoutes.js';
import {ROOFTOP_GARDENS} from './rooftopGardens.js';

// The sky lives on its own schedule. Hatching, fledging and seedfall follow world time,
// not player proximity. Meshes are disposable while observed nest histories persist.
export function createSkyEcology(scene,{onEvent=()=>{},onPollination=()=>{}}={}){
 const root=new THREE.Group();root.name='Living nests and sky seedfall';scene.add(root);
 const geometry={
  nest:new THREE.TorusGeometry(1.08,.30,7,17),
  egg:new THREE.SphereGeometry(.24,9,7),
  chick:new THREE.IcosahedronGeometry(.26,0),
  wing:new THREE.ConeGeometry(.16,.52,5),
  down:new THREE.CircleGeometry(.46,12)
 };
 const materials={
  codeNest:new THREE.MeshBasicMaterial({color:'#459f72'}),
  animeNest:new THREE.MeshToonMaterial({color:'#96745e',flatShading:true}),
  eggs:new THREE.MeshToonMaterial({color:'#e6e2cd'}),
  chick:new THREE.MeshToonMaterial({color:'#b9a179'}),
  codeChick:new THREE.MeshBasicMaterial({color:'#a6f9ce'}),
  accent:new THREE.MeshBasicMaterial({color:'#b5edcb',transparent:true,opacity:.53,side:THREE.DoubleSide,depthWrite:false})
 };
 const glimmerGeo=new THREE.BufferGeometry(),count=24;
 const glimmerPositions=new Float32Array(count*3);
 glimmerGeo.setAttribute('position',new THREE.BufferAttribute(glimmerPositions,3));
 const particles=new THREE.Points(glimmerGeo,new THREE.PointsMaterial({
  color:'#c9f5ca',size:.23,transparent:true,opacity:.78,depthWrite:false,sizeAttenuation:true
 }));
 particles.visible=false;root.add(particles);
 const entries=new Map(),observed=new Map(),eventHistory=[];
 const authored=SKY_SITES.map(s=>({...s,id:'sky:'+s.id,care:0})).concat(
  ROOFTOP_GARDENS.map(s=>({...s,care:0}))
 );
 let weather='STABLE',phase=.5,anime=false,mostRecentTick=-1,latestEvent=null;
 let lastTime=0;
 function makeNest(source){
  const group=new THREE.Group();group.name='Bird nest · '+source.name;
  group.position.set(source.x+Math.min(source.r*.38,2.6),source.y+.43,source.z-Math.min(source.r*.30,1.9));
  root.add(group);
  const base=new THREE.Mesh(geometry.nest,anime?materials.animeNest:materials.codeNest);
  base.rotation.x=Math.PI/2;group.add(base);
  const bowl=new THREE.Mesh(geometry.down,materials.accent);
  bowl.rotation.x=-Math.PI/2;bowl.position.y=-.19;group.add(bowl);
  const eggs=new THREE.Group(),chicks=new THREE.Group();group.add(eggs,chicks);
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3;
   const egg=new THREE.Mesh(geometry.egg,materials.eggs);
   egg.position.set(Math.cos(a)*.36,.04,Math.sin(a)*.36);
   egg.scale.set(.86,1.21,.88);eggs.add(egg);
  }
  for(let i=0;i<2;i++){
   const bird=new THREE.Group();chicks.add(bird);
   const body=new THREE.Mesh(geometry.chick,anime?materials.chick:materials.codeChick);
   body.position.y=.15;bird.add(body);
   const beak=new THREE.Mesh(geometry.wing,new THREE.MeshBasicMaterial({color:'#d5b879'}));
   beak.position.set(0,.17,.25);beak.rotation.x=Math.PI/2;beak.scale.set(.6,.48,.6);bird.add(beak);
   bird.position.set((i?1:-1)*.38,.1,0);
  }
  const entry={source,group,base,eggs,chicks,lastStage:''};
  entries.set(source.id,entry);return entry;
 }
 function setHabitats(generated=[],roofs=[]){
  const roofCare=new Map(roofs.map(r=>[r.id,Number(r.care)||0]));
  const sources=authored.map(s=>({...s,care:roofCare.get(s.id)||0})).concat(
   generated.filter(s=>validNestId(s.id)).slice(0,16).map(s=>({...s,care:s.care||0}))
  );
  const wanted=new Set(sources.map(s=>s.id));
  for(const source of sources){
   let entry=entries.get(source.id);
   if(!entry)entry=makeNest(source);
   entry.source=source;
  }
  for(const [id,entry] of entries){
   if(!wanted.has(id)){root.remove(entry.group);entries.delete(id);}
  }
 }
 function restore(data={}){
  const seen=Array.isArray(data.observed)?data.observed.slice(-120):[];
  for(const pair of seen){
   if(!Array.isArray(pair)||pair.length!==2||!validNestId(pair[0])||
       typeof pair[1]!=='string'||pair[1].length>32)continue;
   observed.set(pair[0],pair[1]);
  }
  const tick=Number(data.lastTick);
  if(Number.isFinite(tick)&&tick>=0)mostRecentTick=Math.floor(tick);
  if(data.lastEvent&&typeof data.lastEvent==='object'&&
      Number.isFinite(data.lastEvent.x)&&Number.isFinite(data.lastEvent.z)){
   latestEvent={...data.lastEvent};
  }
 }
 function snapshot(){
  return {lastTick:mostRecentTick,observed:[...observed].slice(-120),
   lastEvent:latestEvent&&{...latestEvent}};
 }
 function setAnime(value){
  anime=Boolean(value);
  particles.material.color.set(anime?'#f9dfb3':'#a5ffd0');
  for(const e of entries.values()){
   e.base.material=anime?materials.animeNest:materials.codeNest;
   for(const bird of e.chicks.children)bird.children[0].material=anime?materials.chick:materials.codeChick;
  }
 }
 function nearby(position){
  let closest=null,distance=3.8;
  for(const item of entries.values()){
   const d=Math.hypot(position.x-item.group.position.x,position.y-item.group.position.y-1.1,
     position.z-item.group.position.z);
   if(d<distance){closest=item;distance=d;}
  }
  return closest?{source:closest.source,life:nestLife(closest.source.id,lastTime,closest.source.care)}:null;
 }
 function interact(position){
  const near=nearby(position);if(!near)return false;
  const token=near.life.id+':'+near.life.cycle;
  const once=observed.get(near.source.id)!==token;
  if(once){
   observed.set(near.source.id,token);
   if(observed.size>120)observed.delete(observed.keys().next().value);
  }
  const event={type:'NEST OBSERVATION',title:near.source.name+' · '+near.life.label,
   description:near.life.description+(once?' A NEW DETAIL ENTERS YOUR FIELD NOTES.':
    ' The birds continue their daily routine.'),
   id:near.source.id,stage:near.life.id,newObservation:once};
  if(once)onEvent(event);
  return event;
 }
 function update(dt,player,{simTime=0,day=1,dayPhase=.5,weatherState='STABLE',
  paused=false,reduced=false,active=false,generated=[],rooftops=[]}={}){
  lastTime=Math.max(0,simTime);weather=weatherState;phase=dayPhase;
  // Renderer objects are reconciled on the *simulation* update, not each
  // individual animation tick. Existing entries are reused between calls.
  setHabitats(generated,rooftops);
  for(const entry of entries.values()){
   const {source,group}=entry;
   const dist=Math.hypot(player.x-source.x,player.z-source.z);
   group.visible=dist<125&&Math.abs(player.y-source.y)<100;
   if(!group.visible)continue;
   const life=nestLife(source.id,lastTime,source.care);
   entry.eggs.visible=life.id==='eggs';
   entry.chicks.visible=life.id==='chicks'||life.id==='fledged';
   group.scale.setScalar(life.id==='weaving'?.83:1);
   if(!reduced&&!paused){
    entry.chicks.rotation.y=Math.sin(lastTime*.46+source.x)*.19;
    group.rotation.y=Math.sin(lastTime*.12+source.z)*.045;
   }
  }
  // Autonomous seed scattering is keyed by WORLD time. It never depends on the
  // explorer observing the island, and cannot replay on every visit.
  const tick=Math.floor(lastTime/SEEDFALL_INTERVAL);
  if(active&&!paused&&tick>mostRecentTick){
   if(mostRecentTick>=0){
    const sourceList=authored; // independent of which generated meshes are loaded
    const event=seedfallForTick(tick,sourceList);
    if(event){
     latestEvent={...event,at:lastTime};
     onPollination(event);
     onEvent({type:'AUTONOMOUS SKY EVENT',title:'THE GREAT SEEDFALL',
      description:event.description,location:event.name});
    }
   }
   mostRecentTick=tick;
  }
  // The visible seeds are an echo of the latest world event. Their lifetime is
  // short, their GPU buffer is reused, and unseen events still affect the world.
  const visible=latestEvent&&lastTime-latestEvent.at<24&&
   Math.hypot(player.x-latestEvent.x,player.z-latestEvent.z)<130;
  particles.visible=Boolean(visible);
  if(visible&&!reduced){
   for(let i=0;i<count;i++){
    const a=i*2.39996,r=1+(i%7)*1.6;
    const age=(lastTime-latestEvent.at)*(1.2+(i%4)*.35);
    glimmerPositions[i*3]=latestEvent.x+Math.cos(a)*r;
    glimmerPositions[i*3+1]=Math.max(.24,latestEvent.y-age+(i%4)*2);
    glimmerPositions[i*3+2]=latestEvent.z+Math.sin(a)*r;
   }
   glimmerGeo.attributes.position.needsUpdate=true;
   glimmerGeo.computeBoundingSphere();
  }else if(reduced)particles.visible=false;
  return {nearby:active?nearby(player):null,stageCount:NEST_STAGES.length,
   total:entries.size,event:visible?latestEvent:null,lastTick:mostRecentTick};
 }
 function dispose(){
  scene.remove(root);
  for(const g of Object.values(geometry))g.dispose();
  glimmerGeo.dispose();particles.material.dispose();
  for(const material of Object.values(materials))material.dispose();
 }
 return {update,interact,nearby,setAnime,restore,snapshot,dispose,getNests:()=>[...entries.values()].map(e=>({
  id:e.source.id,name:e.source.name,x:e.group.position.x,y:e.source.y,z:e.group.position.z,
  care:e.source.care,stage:nestLife(e.source.id,lastTime,e.source.care).id
 }))};
}
