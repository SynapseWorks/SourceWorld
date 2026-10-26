import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';
import {CITY_PARCELS} from './neighborhoods.js';

// Small shared rooftop sanctuaries turn named city buildings into aerial destinations.
// Landing pads do not replace the original buildings or modify ground collisions.
export const ROOFTOP_GARDENS=Object.freeze([0,2,7,8,10,15].map(index=>{
 const p=CITY_PARCELS[index];
 return Object.freeze({
  id:'roof:'+p.id,x:p.x,z:p.z,y:p.h+2.28,r:Math.min(p.w,p.d)*.30,
  name:p.name+' / ROOF GARDEN',building:p.name,kind:p.kind,
  story:'The neighbours tend a small rooftop habitat above '+p.name+'.'
 });
}));
export function createRooftopGardens(scene,{onDiscover=()=>{},onCare=()=>{}}={}){
 const root=new THREE.Group();root.name='City aerial rooftop gardens';scene.add(root);
 const code=matrixMaterial(13,17,.9,19093,'stone');
 const foliageCode=matrixMaterial(15,14,.82,1992,'foliage');
 const lightCode=matrixMaterial(17,16,1.4,3412,'flower');
 const animeStone=new THREE.MeshToonMaterial({color:'#c6b7a4'});
 const animeGreen=new THREE.MeshToonMaterial({color:'#7da48a',side:THREE.DoubleSide});
 const animeFlower=new THREE.MeshToonMaterial({color:'#edc7b9'});
 const glow=new THREE.MeshBasicMaterial({color:'#f7dbaf',transparent:true,opacity:.18,depthWrite:false});
 const baseGeo=new THREE.CylinderGeometry(1,1,.26,10);
 const stemGeo=new THREE.ConeGeometry(.24,.85,6);
 const planterGeo=new THREE.BoxGeometry(.78,.4,.48);
 const seedGeo=new THREE.IcosahedronGeometry(.23,0);
 const railingGeo=new THREE.TorusGeometry(1,.04,5,48);
 const dummy=new THREE.Object3D(), gardens=[];
 let anime=false,compactQuality=false;
 const discovered=new Set(),care=new Map();
 for(const p of ROOFTOP_GARDENS){
  const group=new THREE.Group();group.name=p.name;group.position.set(p.x,p.y,p.z);root.add(group);
  const platform=new THREE.Mesh(baseGeo,code);
  platform.scale.set(p.r,1,p.r);platform.position.y=-.13;group.add(platform);
  const fence=new THREE.Mesh(railingGeo,code);
  fence.scale.set(p.r*.95,p.r*.95,1);fence.rotation.x=-Math.PI/2;
  fence.position.y=.48;group.add(fence);
  const garden=new THREE.Group();group.add(garden);
  const pots=[];
  for(let i=0;i<7;i++){
   const angle=i*2.399963,rad=(.47+.27*(i%2))*p.r;
   const x=Math.cos(angle)*rad,z=Math.sin(angle)*rad;
   const pot=new THREE.Mesh(planterGeo,code);pot.position.set(x,.24,z);garden.add(pot);
   const leaf=new THREE.Mesh(stemGeo,foliageCode);
   leaf.position.set(x,.83+(i%3)*.12,z);leaf.scale.set(.6,1+(i%3)*.34,.6);
   garden.add(leaf);
   pots.push({pot,leaf});
  }
  // Small readable lanterns light the garden on the simulated evening cycle.
  const lamps=[];
  for(let i=0;i<3;i++){
   const a=i*Math.PI*2/3;
   const lamp=new THREE.Mesh(seedGeo,lightCode);
   lamp.position.set(Math.cos(a)*p.r*.66,1.3,Math.sin(a)*p.r*.66);
   group.add(lamp);
   const aura=new THREE.Mesh(new THREE.SphereGeometry(.45,8,6),glow);
   aura.position.copy(lamp.position);group.add(aura);lamps.push({lamp,aura});
  }
  gardens.push({p,group,platform,fence,garden,pots,lamps});
 }
 function setQuality(value=1){
  const compact=value<=.7;
  compactQuality=compact;
  for(const item of gardens){
   item.pots.forEach(({pot,leaf},i)=>{pot.visible=leaf.visible=!compact||i%2===0;});
   item.lamps.forEach(({lamp,aura},i)=>{lamp.visible=aura.visible=!compact||i===0;});
  }
 }
 function setAnime(enabled){
  anime=Boolean(enabled);
  for(const item of gardens){
   item.platform.material=item.fence.material=anime?animeStone:code;
   for(const {pot,leaf} of item.pots){
    pot.material=anime?animeStone:code;
    leaf.material=anime?animeGreen:foliageCode;
   }
   for(const {lamp} of item.lamps)lamp.material=anime?animeFlower:lightCode;
  }
 }
 function restore(data={}){
  for(const id of Array.isArray(data.discovered)?data.discovered:[])
   if(ROOFTOP_GARDENS.some(p=>p.id===id))discovered.add(id);
  for(const [id,entry] of Object.entries(data.care||{})){
   if(!ROOFTOP_GARDENS.some(p=>p.id===id)||!entry||typeof entry!=='object')continue;
   const total=Number.isFinite(entry.total)?Math.max(0,Math.min(100,Math.floor(entry.total))):0;
   const day=Number.isFinite(entry.day)?Math.max(0,Math.floor(entry.day)):0;
   if(total)care.set(id,{total,day});
  }
 }
 function snapshot(){
  return {discovered:[...discovered],
   care:Object.fromEntries([...care].map(([id,v])=>[id,{...v}]))};
 }
 function getDiscovered(){return ROOFTOP_GARDENS.filter(p=>discovered.has(p.id));}
 function getNearby(position,day=1){
  return ROOFTOP_GARDENS.find(p=>Math.hypot(position.x-p.x,position.z-p.z)<Math.min(3.5,p.r)
   &&Math.abs(position.y-(p.y+1.72))<3.1&&care.get(p.id)?.day!==day)||null;
 }
 function interact(position,day=1){
  const nearby=getNearby(position,day);if(!nearby)return null;
  const previous=care.get(nearby.id)||{total:0,day:0};
  const total=Math.min(100,previous.total+1);
  care.set(nearby.id,{total,day});
  const event={type:'ROOFTOP CARE',title:'GARDEN TENDED · '+nearby.building,
   description:nearby.story+' Migrating birds will notice its new growth.',
   x:nearby.x,z:nearby.z,y:nearby.y,careCount:total};
  onCare(event);return event;
 }
 function floorEyeAt(x,z,y,eyeHeight=1.72){
  let floor=eyeHeight;
  for(const p of ROOFTOP_GARDENS){
   if(Math.hypot(x-p.x,z-p.z)<p.r*.87&&y>=p.y+eyeHeight-1.1)
    floor=Math.max(floor,p.y+eyeHeight);
  }
  return floor;
 }
 function update(dt,player,{time=0,phase=.5,day=1,reduced=false,
  paused=false,active=false}={}){
  const daylight=Math.max(0,Math.sin((phase-.25)*Math.PI*2));
  let nearest=null,nearDist=Infinity;
  for(const item of gardens){
   const {p,group,pots,lamps}=item;
   const distance=Math.hypot(player.x-p.x,player.z-p.z);
   group.visible=distance<150&&Math.abs(player.y-p.y)<122;
   if(!group.visible)continue;
   const amount=care.get(p.id)?.total||0;
   const growth=.64+Math.min(.58,amount*.08)+daylight*.10;
   for(const {leaf} of pots)leaf.scale.y=growth;
   for(const [index,{aura,lamp}] of lamps.entries()){
    aura.visible=daylight<.65&&(!compactQuality||index===0);
    aura.material.opacity=.07+(1-daylight)*.12;
    if(!reduced&&!paused)lamp.rotation.y+=dt*.13;
   }
   if(active&&!paused&&distance<18&&Math.abs(player.y-p.y)<18){
    if(!discovered.has(p.id)){
     discovered.add(p.id);
     onDiscover({...p,type:'ROOFTOP GARDEN'});
    }
    if(distance<nearDist){nearest=p;nearDist=distance;}
   }
  }
  return {nearby:getNearby(player,day),site:nearest,discovered:discovered.size};
 }
 return {setAnime,restore,snapshot,getDiscovered,getNearby,interact,floorEyeAt,
  update,sites:ROOFTOP_GARDENS,
  getHabitats:()=>ROOFTOP_GARDENS.map(p=>({...p,care:care.get(p.id)?.total||0})),
  getStats:()=>({total:gardens.length,visited:discovered.size,caredFor:care.size})};
}
