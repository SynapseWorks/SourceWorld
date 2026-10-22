import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Events use simulation time, not real-time timers, so pause and reduced motion work cleanly.
// All state is session-local: no account, tracking, or database.
const encounters=[
 {id:'wishing-well',title:'THE LISTENING WELL',x:-24,z:-25,r:4.5,kind:'object',note:'A THOUGHT LEFT HERE WILL ECHO SOMEWHERE ELSE.'},
 {id:'seed',title:'THE UNWRITTEN SEED',x:29,z:-94,r:4.7,kind:'object',note:'YOU GAVE AN UNWRITTEN THING PERMISSION TO GROW.'},
 {id:'archive',title:'THE FORGOTTEN ARCHIVE',x:-18,z:-131,r:4.5,kind:'object',note:'IT SAVED THE MOMENT YOU CHOSE TO LOOK.'}
];
const clamp=THREE.MathUtils.clamp;
function rng(n){return (Math.sin(n*127.1+13.9)*43758.5453)%1;}
export function createLivingWorld(scene,{onEvent=()=>{}}={}){
 const interacted=new Set(),seen=new Set();
 const objects=[],creatures=[];
 const coreMaterial=matrixMaterial(17,21,2.1,918);
 const baseMaterial=matrixMaterial(13,15,.8,114);
 const edgeMaterial=new THREE.MeshBasicMaterial({color:0x82ffbf,transparent:true,opacity:.7,depthWrite:false});
 const sphere=new THREE.IcosahedronGeometry(1,1);
 const torus=new THREE.TorusGeometry(1.7,.04,6,48);
 const column=new THREE.CylinderGeometry(1.1,1.4,.5,7);
 encounters.forEach((e,i)=>{
  const group=new THREE.Group();group.position.set(e.x,0,e.z);scene.add(group);
  const base=new THREE.Mesh(column,baseMaterial);base.position.y=.22;group.add(base);
  const core=new THREE.Mesh(sphere,coreMaterial);core.position.y=2.05;core.scale.setScalar(i===1?.65:1);group.add(core);
  const ring=new THREE.Mesh(torus,edgeMaterial.clone());ring.position.y=2.05;ring.rotation.x=Math.PI/2;group.add(ring);
  const glyphs=new THREE.Group();group.add(glyphs);
  for(let k=0;k<7;k++){
   const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.13,.0),coreMaterial);
   const a=k*Math.PI*2/7;shard.position.set(Math.cos(a)*2.1,1.2+(k%3)*.35,Math.sin(a)*2.1);
   glyphs.add(shard);
  }
  objects.push({...e,group,core,ring,glyphs,index:i,activated:false});
 });
 // Small ambient life with distinctive looping trajectories and locally reactive behavior.
 const creatureGeometry=new THREE.OctahedronGeometry(.38,0);
 const tails=new THREE.ConeGeometry(.16,.65,4);
 const animalMaterial=matrixMaterial(9,10,2.4,778);
 for(let i=0;i<14;i++){
  const group=new THREE.Group();scene.add(group);
  const body=new THREE.Mesh(creatureGeometry,animalMaterial);group.add(body);
  const tail=new THREE.Mesh(tails,animalMaterial);tail.position.set(0,-.5,.14);tail.rotation.x=.45;group.add(tail);
  const eye=new THREE.PointLight(0x69ffc2,.24,3);group.add(eye);
  const side=i%2?-1:1;
  const center={x:side*(11+(i*11%29)),z:-20-i*14};
  creatures.push({group,center,i,home:5+(i%5)*1.8,aware:false});
 }
 // A periodic autonomous phenomenon. Reuses just one object, never unbounded particles.
 const phenomenon=new THREE.Group();phenomenon.visible=false;scene.add(phenomenon);
 const halo=new THREE.Mesh(new THREE.TorusGeometry(5,.065,5,84),edgeMaterial.clone());
 halo.rotation.x=Math.PI/2;phenomenon.add(halo);
 const geometry=new THREE.BufferGeometry();
 const positions=new Float32Array(240*3);
 for(let i=0;i<240;i++){
  const a=i*2.39996,r=3+Math.sqrt(i/240)*9;
  positions[i*3]=Math.cos(a)*r;
  positions[i*3+1]=(i%21)*.29;
  positions[i*3+2]=Math.sin(a)*r;
 }
 geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const dust=new THREE.Points(geometry,new THREE.PointsMaterial({color:0x76ffc0,size:.13,transparent:true,opacity:.55,depthWrite:false}));
 phenomenon.add(dust);
 let lastCycle=-1,nearPhenomenon=false;
 const journal=[];
 function record(type,title,description){
  journal.unshift({type,title,description});
  if(journal.length>12)journal.pop();
  onEvent({type,title,description,journal:[...journal]});
 }
 function nearest(position){
  return objects.find(o=>Math.hypot(o.x-position.x,o.z-position.z)<o.r);
 }
 function interact(position,time){
  const item=nearest(position);if(!item)return false;
  if(!item.activated){
   item.activated=true;interacted.add(item.id);
   item.ring.material.color.set(0xffdba1);
   record('DISCOVERY',item.title,item.note);
  }else{
   record('RESONANCE',item.title,'THE MEMORY IS STILL HERE. IT REMEMBERS YOU.');
  }
  item.core.scale.setScalar(1.35);
  return {x:item.x,z:item.z,title:item.title};
 }
 function update(time,dt,player,{motion=true,paused=false}={}){
  const pace=paused?0:dt;
  for(const o of objects){
   const dist=Math.hypot(o.x-player.x,o.z-player.z);
   const awake=clamp(1-(dist-4)/21,0,1);
   o.ring.material.opacity=.28+awake*.66;
   if(motion&&!paused){
    o.core.rotation.y+=pace*(.16+awake*.6);
    o.core.position.y=2.05+Math.sin(time*1.1+o.index)*(.08+awake*.19);
    o.glyphs.rotation.y+=pace*(.18+awake*.45);
   }
   if(dist<9&&!seen.has(o.id)){
    seen.add(o.id);
    record('WHISPER',o.title,'SOMETHING HERE IS WAITING TO BE NOTICED.');
   }
  }
  for(const c of creatures){
   const i=c.i,t=motion?time:0;
   const flee=Math.hypot(c.group.position.x-player.x,c.group.position.z-player.z)<5;
   const radius=c.home+(flee?4:0);
   const angle=t*(.16+(i%3)*.05)+i*2.3;
   c.group.position.set(c.center.x+Math.cos(angle)*radius,1.9+Math.sin(angle*2+i)*.4,c.center.z+Math.sin(angle)*radius);
   c.group.rotation.y=-angle;
   c.group.visible=Math.hypot(c.group.position.x-player.x,c.group.position.z-player.z)<85;
   if(flee&&!c.aware){c.aware=true;record('ENCOUNTER','A WILD SIGNAL','A SMALL SHAPE OF CODE NOTICED YOUR APPROACH AND CHANGED COURSE.');}
   else if(!flee)c.aware=false;
  }
  // An event at a fixed world location, cycling independently of observation.
  const cycle=Math.floor(time/85);
  const phase=time%85;
  phenomenon.position.set(10,6,-155);
  phenomenon.visible=phase>19&&phase<43;
  if(phenomenon.visible){
   halo.material.opacity=.2+.5*Math.sin(Math.PI*(phase-19)/24);
   if(motion&&!paused){halo.rotation.z+=pace*.13;dust.rotation.y+=pace*.065;}
   if(cycle!==lastCycle){lastCycle=cycle;record('WORLD EVENT','THE SKY HAS REMEMBERED','A CIRCLE OF LIGHT FORMED ABOVE THE FOREST, WITH OR WITHOUT A WITNESS.');}
   const nowNear=Math.hypot(player.x-10,player.z+155)<19;
   if(nowNear&&!nearPhenomenon){nearPhenomenon=true;record('WITNESSED','THE MEMORY BLOOM','YOU WERE THERE WHEN THE SKY OPENED.');}
   if(!nowNear)nearPhenomenon=false;
  }else nearPhenomenon=false;
  return {nearby:nearest(player),journal};
 }
 return {update,interact,getJournal:()=>[...journal],encounters};
}
