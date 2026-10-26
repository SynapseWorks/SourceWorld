import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Hand-shaped points of interest in the airborne layer.
// Each site is deliberately visible from existing authored regions,
// and is reachable within the flight stamina budget when travelling between them.
export const SKY_SITES=Object.freeze([
 {id:'swallow',name:'THE SWALLOW PERCH',x:-22,z:-61,y:29,r:6.7,kind:'nest',
  story:'Swallows nest above the printshops. The city has been watched from here for generations.'},
 {id:'canopy',name:'THE CLOUD ORCHARD',x:17,z:-148,y:43,r:7,kind:'garden',
  story:'These airborne roots gather sunlight, then send seeds to the forest below.'},
 {id:'reed',name:'THE REED CROWN',x:94,z:-210,y:39,r:7,kind:'reed',
  story:'The marsh plants have learned to grow in the air. Birds carry water between their roots.'},
 {id:'glass',name:'THE GLASS AERIE',x:108,z:-100,y:52,r:6.5,kind:'crystal',
  story:'A lattice of skyglass sings to the migrating flocks.'},
 {id:'wilds',name:'THE WANDERER’S REST',x:-113,z:-248,y:49,r:7,kind:'camp',
  story:'Every traveler who finds this sanctuary adds something to the nest.'}
]);
export const SKYWELL={x:0,z:-9,y:0,r:4.2,name:'THE SKYWELL'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createSkyRoutes(scene,{onDiscover=()=>{},onCollect=()=>{}}={}){
 const root=new THREE.Group();root.name='Aerial sanctuaries';scene.add(root);
 const code=matrixMaterial(15,19,1.2,2877,'stone');
 const codeLeaf=matrixMaterial(17,19,.85,944,'foliage');
 const codeLight=matrixMaterial(21,21,1.7,344,'crystal');
 const animeStone=new THREE.MeshToonMaterial({color:'#b9c5b4',flatShading:true});
 const animeLeaf=new THREE.MeshToonMaterial({color:'#91bda2'});
 const animeLight=new THREE.MeshToonMaterial({color:'#c9e9ce'});
 const gold=new THREE.MeshBasicMaterial({color:'#ffe2ac',transparent:true,opacity:.78,depthWrite:false});
 const green=new THREE.MeshBasicMaterial({color:'#89fbc4',transparent:true,opacity:.73,depthWrite:false});
 const nestMaterial=new THREE.MeshToonMaterial({color:'#967964',side:THREE.DoubleSide});
 const commonRing=new THREE.TorusGeometry(2.65,.055,5,48);
 const eggGeometry=new THREE.IcosahedronGeometry(.37,1);
 const plantGeometry=new THREE.ConeGeometry(.46,1.65,7);
 const cupGeo=new THREE.TorusGeometry(1.13,.25,6,20);
 const collected=new Set(),discovered=new Set(),sites=[];
 let anime=false;
 const well=new THREE.Group();well.name=SKYWELL.name;well.position.set(SKYWELL.x,0,SKYWELL.z);
 root.add(well);
 const wellPlinth=new THREE.Mesh(new THREE.CylinderGeometry(1.45,1.7,.36,10),code);
 wellPlinth.position.y=.18;well.add(wellPlinth);
 const wellCore=new THREE.Mesh(new THREE.OctahedronGeometry(.65,0),codeLight);
 wellCore.position.y=1.54;well.add(wellCore);
 const wellHalo=new THREE.Mesh(new THREE.TorusGeometry(1.4,.045,6,60),green);
 wellHalo.position.y=2.2;wellHalo.rotation.x=.32;well.add(wellHalo);
 for(let j=0;j<6;j++){
  const a=j*Math.PI/3;
  const spike=new THREE.Mesh(new THREE.ConeGeometry(.19,.96,5),code);
  spike.position.set(Math.cos(a)*1.65,.48,Math.sin(a)*1.65);well.add(spike);
 }
 for(const s of SKY_SITES){
  const group=new THREE.Group();group.name=s.name;
  group.position.set(s.x,s.y,s.z);root.add(group);
  const stoneGroup=new THREE.Group(),paintGroup=new THREE.Group();
  group.add(stoneGroup,paintGroup);paintGroup.visible=false;
  for(const [parent,base,leaf] of [[stoneGroup,code,codeLeaf],[paintGroup,animeStone,animeLeaf]]){
   const top=new THREE.Mesh(new THREE.CylinderGeometry(s.r,s.r*.73,1.7,10),base);
   top.position.y=-.85;parent.add(top);
   for(let i=0;i<6;i++){
    const angle=i*2.399;
    const x=Math.cos(angle)*s.r*.65,z=Math.sin(angle)*s.r*.65;
    const protrusion=new THREE.Mesh(new THREE.IcosahedronGeometry(.86+(i%2)*.34,0),base);
    protrusion.position.set(x,-1.35-(i%3)*.6,z);parent.add(protrusion);
    if(i%2===0){
     const blade=new THREE.Mesh(plantGeometry,leaf);
     blade.position.set(x,.82,z);blade.scale.set(.6,1+i%3*.23,.6);parent.add(blade);
    }
   }
   // Nest and its eggs are a recognizable target from above.
   const cup=new THREE.Mesh(cupGeo,parent===paintGroup?nestMaterial:codeLeaf);
   cup.position.set(0,.7,0);cup.rotation.x=Math.PI/2;parent.add(cup);
   for(let j=0;j<3;j++){
    const egg=new THREE.Mesh(eggGeometry,parent===paintGroup?animeLight:codeLight);
    egg.scale.set(.66,1.15,.64);
    egg.position.set(Math.cos(j*2.09)*.48,.89,Math.sin(j*2.09)*.48);
    parent.add(egg);
   }
   if(s.kind==='crystal'){
    for(let k=0;k<4;k++){
     const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.5+k*.12,0),parent===paintGroup?animeLight:codeLight);
     shard.position.set(Math.sin(k*1.56)*2.6,1.3+(k%2)*.5,Math.cos(k*1.56)*2.6);
     parent.add(shard);
    }
   }else if(s.kind==='camp'){
    for(let k=0;k<3;k++){
     const plank=new THREE.Mesh(new THREE.BoxGeometry(2.4,.18,.7),parent===paintGroup?nestMaterial:code);
     plank.position.set(Math.cos(k*2.09)*3.4,.45,Math.sin(k*2.09)*3.4);plank.rotation.y=k*2.09;parent.add(plank);
    }
   }
  }
  const seed=new THREE.Group();seed.name='Sky Seed';seed.position.y=2.75;group.add(seed);
  const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.55,0),codeLight);seed.add(gem);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(.94,.038,6,42),gold);
  halo.rotation.x=.5;seed.add(halo);
  const landingRing=new THREE.Mesh(new THREE.RingGeometry(4,4.16,40),new THREE.MeshBasicMaterial({
   color:'#c4ffd3',transparent:true,opacity:.31,side:THREE.DoubleSide,depthWrite:false
  }));
  landingRing.rotation.x=-Math.PI/2;landingRing.position.y=.035;group.add(landingRing);
  sites.push({...s,group,stoneGroup,paintGroup,seed,gem,halo,landingRing});
 }
 function restore(ids=[]){
  for(const id of ids)if(SKY_SITES.some(s=>s.id===id)){collected.add(id);discovered.add(id);}
  for(const site of sites)site.seed.visible=!collected.has(site.id);
 }
 function snapshot(){return {collected:[...collected],discovered:[...discovered]};}
 function getNearbyWell(position){
  return Math.hypot(position.x-SKYWELL.x,position.z-SKYWELL.z)<SKYWELL.r&&position.y<7;
 }
 function nearbySeed(position){
  return sites.find(s=>!collected.has(s.id)&&
   Math.hypot(position.x-s.x,position.z-s.z)<3.1&&Math.abs(position.y-(s.y+2.75))<4.2)||null;
 }
 function interact(position){
  const site=nearbySeed(position);
  if(!site)return null;
  collected.add(site.id);discovered.add(site.id);site.seed.visible=false;
  const event={type:'SKY SEED',title:site.name,description:site.story,
   x:site.x,z:site.z,y:site.y,count:collected.size};
  onCollect(event);
  return event;
 }
 function floorEyeAt(x,z,currentY,eyeHeight=1.72){
  let floorEye=eyeHeight;
  for(const s of sites){
   const distance=Math.hypot(x-s.x,z-s.z);
   // Only land on top when approaching the platform from above;
   // never snap a player upward through a floating island.
   if(distance<s.r*.78&&currentY>=s.y+eyeHeight-.35)
    floorEye=Math.max(floorEye,s.y+eyeHeight);
  }
  return floorEye;
 }
 function updraftAt(position){
  let lift=0;
  for(const s of sites){
   const horizontal=Math.hypot(position.x-s.x,position.z-s.z);
   const vertical=Math.abs(position.y-s.y-12);
   if(horizontal<19&&vertical<22){
    lift=Math.max(lift,(1-horizontal/19)*(1-vertical/22)*15);
   }
  }
  return lift;
 }
 function update(t,dt,position,{reduced=false,paused=false}={}){
  const distWell=Math.hypot(position.x-SKYWELL.x,position.z-SKYWELL.z);
  well.visible=distWell<110&&position.y<75;
  if(!paused&&!reduced&&well.visible){
   wellCore.rotation.y+=dt*.33;wellHalo.rotation.z+=dt*.21;
  }
  let nearest=null;
  for(const site of sites){
   const d=Math.hypot(position.x-site.x,position.z-site.z);
   site.group.visible=d<205&&Math.abs(position.y-site.y)<130;
   if(!site.group.visible)continue;
   site.stoneGroup.visible=!anime;site.paintGroup.visible=anime;
   if(!paused&&!reduced){
    site.gem.rotation.y+=dt*.43;site.halo.rotation.z+=dt*.25;
    site.seed.position.y=2.75+Math.sin(t*.78+site.x)*.16;
   }
   if(d<20&&Math.abs(position.y-site.y)<19){
    if(!discovered.has(site.id)){
     discovered.add(site.id);
     onDiscover({id:site.id,name:site.name,x:site.x,z:site.z,y:site.y,description:site.story});
    }
    if(!nearest||d<nearest.distance)nearest={...site,distance:d};
   }
  }
  return {nearby:nearbySeed(position),site:nearest,well:getNearbyWell(position)};
 }
 function setAnime(enabled){
  anime=Boolean(enabled);
  for(const s of sites){s.stoneGroup.visible=!anime;s.paintGroup.visible=anime;}
 }
 return {restore,snapshot,update,setAnime,interact,getNearbyWell,nearbySeed,
  floorEyeAt,updraftAt,getCount:()=>collected.size,sites:SKY_SITES,well:SKYWELL};
}
