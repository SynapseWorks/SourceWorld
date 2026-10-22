import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// Small optional acts of care and persistent restorations, not additional required quests.
export const SITES=[
 {id:'garden',name:'THE QUIET GARDEN',x:22,z:-120,kind:'garden',clue:'A neglected garden by the first trees'},
 {id:'bridge',name:'THE FRACTURED CROSSING',x:70,z:-198,kind:'bridge',clue:'A broken route leading toward the marsh'},
 {id:'beacon',name:'THE WILDS BEACON',x:-91,z:-238,kind:'beacon',clue:'A dormant signal tower among the wilds'}
];
export function createTendingWorld(scene,{onChange=()=>{}}={}){
 const done=new Set(),sites=[];
 const surface=matrixMaterial(12,20,.8,2221);
 const lit=matrixMaterial(18,20,2.2,2341);
 const glow=new THREE.MeshBasicMaterial({color:0xa8ffcb,transparent:true,opacity:.7,depthWrite:false});
 for(const site of SITES){
  const group=new THREE.Group();group.position.set(site.x,0,site.z);scene.add(group);
  const frame=new THREE.Mesh(new THREE.CylinderGeometry(1.6,2,.32,8),surface);frame.position.y=.14;group.add(frame);
  const broken=new THREE.Group();group.add(broken);
  for(let i=0;i<5;i++){
   const part=new THREE.Mesh(new THREE.BoxGeometry(.27,1+i%2*.7,.32),surface);
   part.position.set(Math.cos(i*2.4)*1.1,.6+i%2*.25,Math.sin(i*2.4)*1.1);
   part.rotation.z=(i-2)*.25;broken.add(part);
  }
  const restored=new THREE.Group();restored.visible=false;group.add(restored);
  if(site.kind==='garden'){
   for(let i=0;i<14;i++){
    const a=i*2.399,r=.45+Math.sqrt(i/14)*3.3;
    const flower=new THREE.Mesh(new THREE.ConeGeometry(.2+i%3*.08,.8+i%4*.36,5),lit);
    flower.position.set(Math.cos(a)*r,.43,Math.sin(a)*r);restored.add(flower);
   }
  }else if(site.kind==='bridge'){
   for(let i=0;i<13;i++){
    const section=new THREE.Mesh(new THREE.BoxGeometry(1.4,.18,1.08),lit);
    section.position.set(0,.55,(i-6)*1.2);restored.add(section);
   }
   for(const side of [-1,1]){
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,15.5),glow);
    rail.position.set(side*.7,1.1,0);restored.add(rail);
   }
  }else{
   const spire=new THREE.Mesh(new THREE.CylinderGeometry(.18,.65,12,7),lit);
   spire.position.y=6;restored.add(spire);
   for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(1+i*.35,.04,6,52),glow.clone());
    ring.position.y=5+i*2;ring.rotation.x=Math.PI/3;restored.add(ring);
   }
  }
  sites.push({...site,group,broken,restored,restoredAt:0});
 }
 function restore(ids=[]){
  for(const id of ids){if(SITES.some(s=>s.id===id))done.add(id);}
  for(const s of sites){s.broken.visible=!done.has(s.id);s.restored.visible=done.has(s.id);}
 }
 function nearest(player){
  return sites.find(s=>!done.has(s.id)&&Math.hypot(s.x-player.x,s.z-player.z)<5);
 }
 function interact(player,unlocked=false){
  const site=nearest(player);
  if(!site||!unlocked)return false;
  done.add(site.id);site.broken.visible=false;site.restored.visible=true;
  onChange({type:'WORLD REWRITE',title:site.name,description:'A BROKEN PLACE WAS MENDED. THE WORLD WILL KEEP THIS CHANGE.'});
  return site;
 }
 function update(t,dt,player,{paused=false,reduced=false}={}){
  for(const site of sites){
   const near=Math.hypot(site.x-player.x,site.z-player.z);
   site.group.visible=near<105;
   if(done.has(site.id)&&!paused&&!reduced)site.restored.rotation.y+=dt*.012;
  }
  return nearest(player);
 }
 return {update,interact,restore,getRestored:()=>[...done],getNearby:nearest,sites:SITES};
}
