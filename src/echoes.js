import * as THREE from 'three';
import {matrixMaterial} from './matrixMaterial.js';

// A finite set of optional hidden echoes. These do not replace the narrative signals.
// Discovery requires physical exploration rather than a permanent HUD waypoint.
export const ECHO_SITES=[
 {id:'alley',x:-11,z:-17,name:'ALLEY ECHO',clue:'Behind the first street of towers'},
 {id:'canopy',x:31,z:-54,name:'ROOFTOP MEMORY',clue:'Under the city’s hanging geometry'},
 {id:'mirror',x:-48,z:-42,name:'MIRROR FRAGMENT',clue:'Beyond the reflective plaza'},
 {id:'fissure',x:58,z:-75,name:'FRACTURED VERSE',clue:'At the rim of the fracture garden'},
 {id:'understory',x:-22,z:-169,name:'ROOT WHISPER',clue:'Where forest paths fork'},
 {id:'shallows',x:91,z:-226,name:'MARSH SONG',clue:'On the quiet marsh bank'},
 {id:'plateau',x:121,z:-100,name:'GLASS SONG',clue:'Past the plateau monument'},
 {id:'wilds',x:-128,z:-263,name:'WILD SEED',clue:'Where the wilds begin to thin'},
 {id:'heart',x:21,z:-239,name:'AFTERGLOW',clue:'Beyond the Heart’s clearing'}
];
export const UNLOCK_COUNT=4;
export function createEchoes(scene,{onCollect=()=>{}}={}){
 const found=new Set(),pieces=[];
 const shellMaterial=matrixMaterial(14,16,1.55,1721);
 const lineMaterial=new THREE.MeshBasicMaterial({color:0xc1ffda,transparent:true,opacity:.45,depthWrite:false});
 const geometry=new THREE.DodecahedronGeometry(.43,0);
 for(const [i,e] of ECHO_SITES.entries()){
  const group=new THREE.Group();group.position.set(e.x,1.25,e.z);
  const core=new THREE.Mesh(geometry,shellMaterial);group.add(core);
  const shell=new THREE.Mesh(new THREE.TorusGeometry(.75,.018,4,36),lineMaterial.clone());
  shell.rotation.x=Math.PI/3;group.add(shell);
  const floor=new THREE.Mesh(new THREE.RingGeometry(.45,1.15,32),new THREE.MeshBasicMaterial({
   color:0x3b9b73,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false
  }));
  floor.rotation.x=-Math.PI/2;floor.position.y=-1.17;group.add(floor);
  scene.add(group);pieces.push({...e,group,core,shell,index:i});
 }
 function restore(ids=[]){
  for(const id of ids){if(!ECHO_SITES.some(e=>e.id===id))continue;found.add(id);}
  pieces.forEach(e=>{e.group.visible=!found.has(e.id);});
 }
 function interact(player){
  const near=pieces.find(e=>!found.has(e.id)&&Math.hypot(player.x-e.x,player.z-e.z)<2.7);
  if(!near)return false;
  found.add(near.id);near.group.visible=false;
  onCollect({name:near.name,id:near.id,count:found.size,unlocked:found.size>=UNLOCK_COUNT});
  return {x:near.x,z:near.z,name:near.name};
 }
 function update(t,dt,player,{reduced=false,paused=false}={}){
  let near=null;
  for(const e of pieces){
   if(found.has(e.id))continue;
   const distance=Math.hypot(player.x-e.x,player.z-e.z);
   // Low-contrast at distance, a gentle light when you are close.
   e.group.visible=distance<65;
   e.shell.material.opacity=.16+.45*(1-THREE.MathUtils.smoothstep(distance,2,23));
   if(!paused&&!reduced){
    e.core.rotation.y+=dt*.27;
    e.group.position.y=1.25+Math.sin(t*.8+e.index)*.12;
   }
   if(distance<2.7)near=e;
  }
  return near;
 }
 return {interact,update,restore,getFound:()=>[...found],getCount:()=>found.size,sites:ECHO_SITES};
}
